import _ from "lodash";
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection, Connection, Not, IsNull } from "typeorm-plus";
import { GraphQLSchema } from "graphql";
import { InputLogEvent } from "aws-sdk/clients/cloudwatchlogs";
import { Router } from "express";
import AWS, { CloudWatchLogs } from "aws-sdk";
import cp, { ChildProcess } from "child_process";
import debug from "debug";
import fs from "fs";
import next from "next";
import path from "path";
import redis, { RedisClient } from "redis";
import Redlock from "redlock";
import timestring from "timestring";
import { Container } from "typedi";

import { TasksResolver, TaskRunResolver, RootResolver } from "../resolvers";
import { Task } from "../models/Task";
import { TaskRun, TaskRunState } from "../models/TaskRun";
import { validateTaskDefinition, TaskDefinition } from "./TaskDefinition";
import { Options } from "./Options";
import { rand } from "../resolvers/util";

/** User object for NiceCommander */
export interface NiceCommanderUser {
  name?: string;
  email?: string;
}

interface TaskDefinitionFile {
  taskDefinition: TaskDefinition;
  filePath: string;
}

export interface NiceCommanderContext {
  viewer?: NiceCommanderUser;
}

/**
 * Nice Commander
 *
 * run scheduled and one-off tasks in your Node.js server with a nice UI
 *
 * To debug Nice Commander set `DEBUG` environment variable to `"nice-commander"`
 */
export class NiceCommander {
  private readonly DB_CONNECTION_NAME = `NiceCommander_${rand()}`;
  private readonly REDIS_TASK_SCHEDULE_PREFIX = "NiceCommander:task:schedule:";
  private readonly REDIS_TASK_TIMEOUT_PREFIX = "NiceCommander:task:timeout:";
  private readonly REDIS_TASK_STOP_PREFIX = "NiceCommander:task:stop:";
  private readonly REDIS_KEY_EXPIRED_CHANNEL = "__keyevent@1__:expired";
  private readonly taskDefinitionsFiles: TaskDefinitionFile[] = [];
  private readonly connectionPromise!: Promise<Connection>;
  private readonly debug = debug("nice-commander");
  private readonly invokeFile = path.resolve(__dirname, "./invoke.js");
  private readonly redisClient!: RedisClient;
  private readonly redisSubscriber!: RedisClient;
  private readonly redLock!: Redlock;
  private schema?: GraphQLSchema;
  /**
   * A map of taskRun IDs to forked child processes for running the job
   * Each instance of NiceCommander will maintain its own map of taskRun IDs to forked child processes
   * For killing a taskRun that is timed out, all instances of NiceCommander will receive a Redis key
   * expired signal and try to find the child process in their map and kill the process.
   */
  private readonly childProcesses: Map<string, ChildProcess> = new Map();
  /** AWS CloudWatch Logs Log Group Name */
  public logGroupName = "NiceCommander";
  public cloudWatchLogs!: CloudWatchLogs;

  public constructor(private options: Options) {
    this.logGroupName =
      options.awsCloudWatchLogsLogGroupName || this.logGroupName;

    this.cloudWatchLogs = new AWS.CloudWatchLogs({
      region: options.awsRegion,
      credentials: options.awsCredentials,
    });

    this.cloudWatchLogs
      .createLogGroup({
        logGroupName: this.logGroupName,
      })
      .promise()
      .then(() =>
        this.debug(
          "Made CloudWatch Logs Log Group with name",
          this.logGroupName
        )
      )
      .catch((e) => {
        if (e.code === "ResourceAlreadyExistsException") return;
        console.error("Failed to make Log Group named", this.logGroupName, e);
      });

    this.taskDefinitionsFiles = this.readTaskDefinitions(
      options.taskDefinitionsDirectory
    );

    this.redisClient = redis.createClient({
      host: options.redisConnectionOptions.host,
      port: options.redisConnectionOptions.port,
      db: 1,
    });

    this.redisSubscriber = redis.createClient({
      host: options.redisConnectionOptions.host,
      port: options.redisConnectionOptions.port,
      db: 1,
    });

    if (options.redisConnectionOptions.setNotifyKeyspaceEvents !== false) {
      this.redisSubscriber.config("SET", "notify-keyspace-events", "Ex");
    }

    if (!options.getUser) {
      this.options.getUser = async (req) => ({
        name: req?.user?.name,
        email: req?.user?.email,
      });
    }

    // Subscribe to key expiration messages
    this.redisSubscriber.subscribe(this.REDIS_KEY_EXPIRED_CHANNEL);
    this.redisSubscriber.on("message", (channel, message) => {
      if (channel !== this.REDIS_KEY_EXPIRED_CHANNEL) return;

      // if key expired as a result of an scheduled task key that was set to expire
      if (message.startsWith(this.REDIS_TASK_SCHEDULE_PREFIX)) {
        // invoke the task
        this.onTaskScheduleKeyExpired(message);
      }

      // if the key expired as a result of a task run timeout key that was set to expire
      // to kill that task past its time budget
      if (message.startsWith(this.REDIS_TASK_TIMEOUT_PREFIX)) {
        // try to kill that child process
        this.onTaskTimeoutKeyExpired(message);
      }

      // if key expired as a s resulr of a task run stopping command, try to stop the task run
      if (message.startsWith(this.REDIS_TASK_STOP_PREFIX)) {
        this.onTaskRunStop(message);
      }
    });

    this.redLock = new Redlock(
      [
        redis.createClient({
          host: options.redisConnectionOptions.host,
          port: options.redisConnectionOptions.port,
          db: 2,
        }),
      ],
      { retryCount: 0 }
    );

    // Create the DB connection
    this.connectionPromise = createConnection({
      ...options.sqlConnectionOptions,
      name: this.DB_CONNECTION_NAME,
      synchronize: true,
      logging: false,
      entities: [
        path.resolve(__dirname, "../models/Task.js"),
        path.resolve(__dirname, "../models/TaskRun.js"),
      ],
    }).then((connection) => {
      this.debug(`Connection ${connection.name} is created successfully.`);
      return connection;
    });
  }

  /**
   * Every time Nice Commander boots up, it will read all of task definition files and updates models
   * in the database accordingly . We rely on definition name to find corresponding model in our
   * database
   *
   * @param taskDefinitionsFiles List of task definition files
   */
  private async sync(taskDefinitionsFiles: TaskDefinitionFile[]) {
    const connection = await this.connectionPromise;
    const taskRepository = connection.getRepository(Task);

    // Sync incoming task definitions to database
    for (const taskDefinitionFile of taskDefinitionsFiles) {
      const existingTask = await taskRepository.findOne({
        name: taskDefinitionFile.taskDefinition.name,
      });

      const task = existingTask || new Task();

      const { timeoutAfter } = taskDefinitionFile.taskDefinition;

      if (typeof timeoutAfter === "string") {
        task.timeoutAfterDescription = timeoutAfter;
        task.timeoutAfter = timestring(timeoutAfter, "ms");
      } else {
        task.timeoutAfterDescription = `${timeoutAfter} milliseconds`;
        task.timeoutAfter = timeoutAfter;
      }

      task.name = taskDefinitionFile.taskDefinition.name;
      task.description =
        taskDefinitionFile.taskDefinition.description ?? "No description";
      task.schedule = taskDefinitionFile.taskDefinition.schedule || "manual";
      task.code = fs.readFileSync(taskDefinitionFile.filePath).toString();

      await taskRepository.save(task);
    }

    // handle deleted tasks that exist in db but not on FS
    const allTaskDefinitions = await taskRepository.find({
      take: Number.MAX_SAFE_INTEGER,
    });
    const allTaskDefinitionsNames = allTaskDefinitions.map((td) => td.name);
    const deletedNames = _.difference(
      allTaskDefinitionsNames,
      taskDefinitionsFiles.map((tdf) => tdf.taskDefinition.name)
    );
    for (const name of deletedNames) {
      const deletedTask = await taskRepository.findOne({ where: { name } });
      if (deletedTask) {
        taskRepository.softDelete(deletedTask);
      }
    }

    // Mark task runs that are still in running state but have actually timed out as timed out
    const taskRunRepository = connection.getRepository(TaskRun);
    const all = await taskRunRepository.count({
      where: { state: TaskRunState.RUNNING },
    });
    const take = 10;
    let skip = 0;

    while (skip + take < all) {
      const taskRuns = await taskRunRepository.find({
        take,
        skip,
        where: { state: TaskRunState.RUNNING },
        relations: ["task"],
      });

      for (const taskRun of taskRuns) {
        const startTime = parseInt(String(taskRun.startTime), 10);
        if (startTime + taskRun.task.timeoutAfter < Date.now()) {
          taskRun.state = TaskRunState.TIMED_OUT;
          taskRunRepository.save(taskRun);
        }
      }

      skip += take;
    }
  }

  private requireTaskDefinition(filePath: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(filePath);

    if (typeof module.run === "function") {
      return module;
    }

    if (typeof module?.default?.run === "function") {
      return module.default;
    }

    throw new Error(`Task definition at ${filePath} is not valid`);
  }

  /**
   * Read tasks definitions from a directory
   * @param directory The path where tasks are stored at.
   *
   */
  private readTaskDefinitions(directory: string) {
    if (!directory.startsWith("/")) {
      throw new Error("directory path must be absolute");
    }

    return fs
      .readdirSync(directory)
      .map((file) => path.resolve(directory, file))
      .filter((filePath) => fs.statSync(filePath).isFile())
      .filter((filePath) => filePath.endsWith(".js"))
      .map((filePath) => {
        const taskDefinition = this.requireTaskDefinition(filePath);

        validateTaskDefinition(taskDefinition);
        const taskDefinitionFile: TaskDefinitionFile = {
          filePath,
          taskDefinition,
        };
        return taskDefinitionFile;
      });
  }

  /**
   * Here we manage schedules of each task
   */
  private async schedule() {
    const connection = await this.connectionPromise;
    const taskRepository = connection.getRepository(Task);
    const taskRunRepository = connection.getRepository(TaskRun);

    const scheduledTasks = await taskRepository.find({
      // TODO: paginate
      take: Number.MAX_SAFE_INTEGER,
      where: {
        schedule: Not("manual"),
      },
    });

    const names = scheduledTasks.map((s) => s.name);
    console.log("Scheduled tasks", names);

    for (const task of scheduledTasks) {
      const [lastTaskRun] = await taskRunRepository.find({
        where: { task, endTime: Not(IsNull()) },
        order: {
          endTime: "DESC",
        },
        take: 1,
      });

      console.log("lastTaskRun", lastTaskRun?.startTime);

      const now = Date.now();
      const scheduleMs = timestring(task.schedule, "ms");

      // Default to scheduling next run immoderately after now
      let expires = scheduleMs;

      // In case we found the last run, schedule after last run's end time to keep on schedule
      if (lastTaskRun) {
        if (lastTaskRun.state !== TaskRun.TaskRunState.FINISHED) {
          // Invoke immediately if last run was not successful
          expires = 1;
        } else {
          const nextRun = parseInt(lastTaskRun.endTime, 10) + scheduleMs;

          if (nextRun < now) {
            // We are past due, schedule for immediate invocation
            expires = 1;
          } else {
            expires = nextRun - now;
          }
        }
      } else {
        // if this is the first time, run immediately
        expires = 1;
      }

      this.scheduleTask(task, expires);
    }
  }

  /**
   * Schedule a task to run in X milliseconds
   * @param task Task
   * @param inMs Time in milliseconds
   */
  private async scheduleTask(task: Task, inMs: number) {
    this.debug(
      "scheduleTask, ",
      `${this.REDIS_TASK_SCHEDULE_PREFIX}${task.id}`,
      task.id,
      "PX",
      inMs
    );
    // fire and forget
    this.redisClient.set(
      `${this.REDIS_TASK_SCHEDULE_PREFIX}${task.id}`,
      task.id,
      "PX",
      inMs
    );
  }

  private async onTaskScheduleKeyExpired(message: string) {
    this.debug("onTaskScheduleKeyExpired", message);
    const taskId = message.replace(this.REDIS_TASK_SCHEDULE_PREFIX, "");
    const connection = await this.connectionPromise;
    const taskRepository = connection.getRepository(Task);
    const taskRunRepository = connection.getRepository(TaskRun);
    const task = await taskRepository.findOne(taskId);

    if (task) {
      this.debug(`Starting task "${task.name}" on schedule on ${new Date()}`);
      const taskRun = new TaskRun();
      taskRun.task = task;
      taskRun.startTime = Date.now();
      taskRun.state = TaskRun.TaskRunState.RUNNING;
      taskRun.invocationSource = TaskRun.InvocationSource.SCHEDULED;
      await taskRunRepository.save(taskRun);
      this.startTask(taskRun);

      // Schedule the next run
      this.scheduleTask(task, timestring(task.schedule, "ms"));
    }
  }

  private async onTaskTimeoutKeyExpired(message: string) {
    const taskRunId = message.replace(this.REDIS_TASK_TIMEOUT_PREFIX, "");
    const connection = await this.connectionPromise;
    const taskRunRepository = connection.getRepository(TaskRun);
    const taskRun = await taskRunRepository.findOne(taskRunId);

    if (
      taskRun &&
      taskRun.state === TaskRun.TaskRunState.RUNNING &&
      this.childProcesses.has(taskRun.id)
    ) {
      await this.endTaskRun(TaskRun.TaskRunState.TIMED_OUT, taskRun, undefined);

      this.killTaskRunProcess(taskRun.id);
    }
  }

  /**
   * Respond to message on of killing a task run
   */
  private async onTaskRunStop(message: string) {
    const taskRunId = message.replace(this.REDIS_TASK_STOP_PREFIX, "");
    const childExists = this.childProcesses.has(taskRunId);

    if (childExists) {
      const connection = await this.connectionPromise;
      const taskRunRepository = connection.getRepository(TaskRun);
      const taskRun = await taskRunRepository.findOne(taskRunId);

      if (taskRun) {
        taskRun.state = TaskRun.TaskRunState.KILLED;
        await taskRunRepository.save(taskRun);

        this.killTaskRunProcess(taskRunId);
      }
    }
  }

  /** Do the business of ending life of a task run */
  private async endTaskRun(
    state: TaskRun["state"],
    taskRun: TaskRun,
    exitCode: number | null = null,
    exitSignal: string | null = null
  ) {
    const connection = await this.connectionPromise;
    const taskRunRepository = connection.getRepository(TaskRun);

    taskRun.state = state;
    taskRun.endTime = Date.now().toString();
    taskRun.exitCode = exitCode;
    taskRun.exitSignal = exitSignal;
    await taskRunRepository.save(taskRun);
  }

  /**
   * Try to kill associated child process with this taskRun.
   *
   * Returns true if the child process was associated with this instance and was successfully killed.
   */
  private killTaskRunProcess(taskRunId: string) {
    if (this.childProcesses.has(taskRunId)) {
      this.childProcesses.get(taskRunId)?.kill("SIGABRT");
      this.childProcesses.delete(taskRunId);
      return true;
    }
    return false;
  }

  /**
   * Programmatically start a new task
   */
  public async startTaskByName(
    taskName: string,
    payload = "{}",
    invocationSource = TaskRun.InvocationSource.API
  ) {
    const connection = await this.connectionPromise;
    const taskRepository = connection.getRepository(Task);
    const taskRunRepository = connection.getRepository(TaskRun);
    const task = await taskRepository.findOne({ where: { name: taskName } });

    if (!task) {
      throw new Error(`Can not find task named ${taskName}`);
    }

    const taskRun = new TaskRun();
    taskRun.payload = payload;
    taskRun.startTime = Date.now();
    taskRun.invocationSource = invocationSource;
    taskRun.state = TaskRun.TaskRunState.RUNNING;
    taskRun.task = task;

    await taskRunRepository.save(taskRun);
    this.startTask(taskRun);
    await taskRunRepository.save(taskRun);
  }

  /**
   * Programmatically stop a task run
   */
  public async stopTaskRunById(taskRunId: string) {
    const connection = await this.connectionPromise;
    const taskRunRepository = connection.getRepository(TaskRun);
    const taskRun = await taskRunRepository.findOne(taskRunId);

    if (!taskRun) {
      throw new Error(`Can not find task run with id ${taskRunId}`);
    }

    return this.stopTask(taskRun);
  }

  /**
   * Start a task with a given task run
   * @param taskRun The TaskRun model instance. This TaskRun instance should be set in the state of "RUNNING"
   * @param publishLogs Logging pub-sub
   */
  public async startTask(taskRun: TaskRun) {
    const taskDefinitionFile = this.taskDefinitionsFiles.find(
      ({ taskDefinition }) => taskDefinition.name === taskRun.task.name
    );

    if (!taskRun) {
      throw new Error("Can not find task run model");
    }

    if (!taskDefinitionFile) {
      throw new Error("Can not find task definition");
    }

    // Try to get a lock for this task run
    try {
      // Add one second to task timeout for safety
      const lockTTL = taskRun.task.timeoutAfter + 1000;
      await this.redLock.lock(taskRun.redisLockKey, lockTTL);

      await this.cloudWatchLogs
        .createLogStream({
          logGroupName: this.logGroupName,
          logStreamName: taskRun.uniqueId,
        })
        .promise();

      // Add a Redis key for noticing when task run is timed out
      this.redisClient.set(
        `${this.REDIS_TASK_TIMEOUT_PREFIX}${taskRun.id}`,
        taskRun.id,
        "PX",
        taskRun.task.timeoutAfter
      );

      // Create a child process
      const child = cp.fork(
        this.invokeFile,
        [taskDefinitionFile.filePath, taskRun.payload],
        {
          stdio: "pipe",
        }
      );

      // Store the child process
      this.childProcesses.set(String(taskRun.id), child);

      // TODO: Refactor this into a Node.js Stream so we can pipe stdout of child into it.
      let logSubmitIsInFlight = false;
      let sequenceToken: string | undefined;
      const eventsBuffer: InputLogEvent[] = [];

      const submitLogs = _.throttle(async () => {
        if (logSubmitIsInFlight) return;

        try {
          logSubmitIsInFlight = true;

          // Drain the logs buffer
          const logEvents: InputLogEvent[] = [];
          while (eventsBuffer.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            logEvents.push(eventsBuffer.shift()!);
          }

          const data = await this.cloudWatchLogs
            .putLogEvents({
              sequenceToken,
              logGroupName: this.logGroupName,
              logStreamName: taskRun.uniqueId,
              logEvents,
            })
            .promise();

          sequenceToken = data?.nextSequenceToken;
        } catch (e) {
          this.debug("Error putting logs in CloudWatch Logs", e);
        } finally {
          logSubmitIsInFlight = false;

          if (eventsBuffer.length) {
            submitLogs();
          }
        }
      }, 1000);

      child.stdout?.on("data", async (chunk) => {
        eventsBuffer.push({ message: String(chunk), timestamp: Date.now() });
        submitLogs();
      });

      child.stderr?.on("data", async (chunk) => {
        eventsBuffer.push({ message: String(chunk), timestamp: Date.now() });
        submitLogs();
      });

      // Pass through logs to stdout/stderr
      if (this.options.logToStdout) {
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      }

      child.on("exit", async (code, signal) => {
        // Fetch a fresh instance of taskRun because there might be state changes outside of
        // this process that has happened to the taskRun
        const connection = await this.connectionPromise;
        const taskRunRepository = connection.getRepository(TaskRun);
        const freshTaskRun = await taskRunRepository.findOne(taskRun.id);

        // Skip ending TaskRun if it was timed out or was killed
        if (
          !freshTaskRun ||
          freshTaskRun.state === TaskRun.TaskRunState.TIMED_OUT ||
          freshTaskRun.state === TaskRun.TaskRunState.KILLED
        ) {
          return;
        }

        // Delete the timeout key for this task run
        this.redisClient.del(
          `${this.REDIS_TASK_TIMEOUT_PREFIX}${taskRun.id}`,
          taskRun.id
        );

        // End the task
        this.endTaskRun(
          code === 0
            ? TaskRun.TaskRunState.FINISHED
            : TaskRun.TaskRunState.ERROR,
          freshTaskRun,
          code,
          signal
        );
      });
    } catch {
      // ignore failing to acquire a lock, this is task run is probably run by another host
    }
  }

  /**
   * Stop a task that is running by broadcasting a message via Redis channel
   * to all nodes to find and stop the process
   */
  public stopTask(taskRun: TaskRun) {
    // Can't stop task run that is not running
    if (taskRun.state !== TaskRun.TaskRunState.RUNNING) {
      return false;
    }

    this.redisClient.set(
      `${this.REDIS_TASK_STOP_PREFIX}${taskRun.id}`,
      taskRun.id,
      "PX",
      1
    );

    return true;
  }

  private async getApolloServerMiddleware() {
    const connection = await this.connectionPromise;

    Container.set({
      id: "connection",
      factory: () => connection,
    });
    Container.set({
      id: "niceCommander",
      factory: () => this,
    });

    this.schema = await buildSchema({
      resolvers: [RootResolver, TasksResolver, TaskRunResolver],
      container: Container,
    });

    const server = new ApolloServer({
      schema: this.schema,
      playground: true,
      introspection: true,
      context: async (args) => {
        const viewer = await this.options?.getUser?.(args?.req);

        return { viewer };
      },
    });

    return server.getMiddleware({ path: "/graphql" });
  }

  private async getNextJsRequestHandler(mountPath: string) {
    const dev = process.env.DEBUG?.includes("nice-commander");
    const dir = path.resolve(__dirname, "../../../../src/ui");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextConfig = require(path.join(dir, "next.config.js"));

    const app = next({
      dev,
      dir,
      conf: nextConfig({
        assetPrefix: mountPath,
        publicRuntimeConfig: {
          schema: this.schema,
          baseUrl: mountPath,
          getUser: this.options.getUser,
        },
      }),
    });
    await app.prepare();
    const handle = app.getRequestHandler();
    return handle;
  }

  /**
   * Get express middleware to be mounted in your app
   *
   *    const middleware = getExpressMiddleware();
   *    app.use('/admin/commander', middleware);
   */
  public getExpressMiddleware() {
    const router = Router();

    let isBootstrapped = false;
    let bootstrapError: Error | null = null;

    const bootstrap = async () => {
      // Sync task definitions
      await this.sync(this.taskDefinitionsFiles);

      // Schedule tasks
      await this.schedule();

      // API
      const middleware = await this.getApolloServerMiddleware();
      router.use(middleware);

      // UI
      const handler = await this.getNextJsRequestHandler(
        this.options.mountPath
      );
      router.all("*", (req, res) => handler(req, res));

      isBootstrapped = true;
    };

    bootstrap().catch((e) => (bootstrapError = e));

    router.all("*", (_, res, next) => {
      if (bootstrapError) {
        return next(bootstrapError);
      }

      if (isBootstrapped) {
        return next();
      }

      res.status(200).send(
        `<html>
            <head>
              <meta http-equiv="refresh" content="1">
            </head>
            <body>
              <pre>NiceCommander is being bootstrapped. Please wait...</pre>
            </body>
          </html>`
      );
    });

    return router;
  }
}

/**
 * Create a Nice Commander instance with an Express middleware
 * Use the returned `startTask` to programmatically start tasks in your application
 */
export function createMiddleware(options: Options) {
  const instance = new NiceCommander(options);
  const middleware = instance.getExpressMiddleware();

  return {
    instance,
    middleware,
    startTask: instance.startTaskByName.bind(instance),
    stopTaskRun: instance.stopTaskRunById.bind(instance),
  };
}
