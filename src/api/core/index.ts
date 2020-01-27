import "reflect-metadata";
import path from "path";
import { Router } from "express";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import next from "next";
import { createConnection, Connection, Not, IsNull } from "typeorm";
import debug from "debug";
import fs from "fs";
import redis, { RedisClient } from "redis";
import cp from "child_process";
import AWS from "aws-sdk";
import { PassThrough } from "stream";
import Redlock from "redlock";
import timestring from "timestring";

import { getTasksResolver, getTasksRunResolver } from "../resolvers";
import { Task } from "../models/Task";
import { TaskRun } from "../models/TaskRun";
import { validateTaskDefinition, TaskDefinition } from "./TaskDefinition";
import { Options } from "./Options";
import { rand } from "../resolvers/util";

interface TaskDefinitionFile {
  taskDefinition: TaskDefinition;
  filePath: string;
}

/**
 * Nice Commander
 *
 * run scheduled and one-off tasks in your Node.js server with a nice UI
 *
 * To debug Nice Commander set `DEBUG` environment variable to `"nice-commander"`
 */
export default class NiceCommander {
  private readonly DB_CONNECTION_NAME = `NiceCommander_${rand()}`;
  private readonly REDIS_TASK_SCHEDULE_PREFIX = "NiceCommander:task:schedule:";
  private readonly REDIS_TASK_TIMEOUT_PREFIX = "NiceCommander:task:timeout:";
  private readonly REDIS_KEY_EXPIRED_CHANNEL = "__keyevent@1__:expired";
  private readonly taskDefinitionsFiles: TaskDefinitionFile[] = [];
  private readonly connectionPromise!: Promise<Connection>;
  private readonly debug = debug("nice-commander");
  private readonly invokeFile = path.resolve(__dirname, "./invoke");
  private readonly s3 = new AWS.S3({ apiVersion: "2006-03-01" });
  private readonly s3BucketName!: string;
  private readonly redisClient!: RedisClient;
  private readonly redisSubscriber!: RedisClient;
  private readonly redLock!: Redlock;

  public constructor(private options: Options) {
    this.taskDefinitionsFiles = this.readTaskDefinitions(
      options.taskDefinitionsDirectory
    );

    this.s3BucketName = options.s3BucketName ?? "nice-commander";

    this.redisClient = redis.createClient({
      host: options.redisConnectionOptions.host,
      port: options.redisConnectionOptions.port,
      db: 1
    });

    this.redisSubscriber = redis.createClient({
      host: options.redisConnectionOptions.host,
      port: options.redisConnectionOptions.port,
      db: 1
    });

    if (options.redisConnectionOptions.setNotifyKeyspaceEvents !== false) {
      this.redisSubscriber.config("SET", "notify-keyspace-events", "Ex");
    }

    this.redisSubscriber.subscribe(this.REDIS_KEY_EXPIRED_CHANNEL);
    this.redisSubscriber.on("message", (channel, message) => {
      if (channel !== this.REDIS_KEY_EXPIRED_CHANNEL) return;

      if (message.startsWith(this.REDIS_TASK_SCHEDULE_PREFIX)) {
        this.onTaskScheduleKeyExpired(message);
      }
      if (message.startsWith(this.REDIS_TASK_TIMEOUT_PREFIX)) {
        this.onTaskTimeoutKeyExpired(message);
      }
    });

    this.redLock = new Redlock(
      [
        redis.createClient({
          host: options.redisConnectionOptions.host,
          port: options.redisConnectionOptions.port,
          db: 2
        })
      ],
      { retryCount: 0 }
    );

    // Create the DB connection
    this.connectionPromise = createConnection({
      ...options.sqlConnectionOptions,
      name: this.DB_CONNECTION_NAME,
      synchronize: true,
      logging: false,
      entities: [path.resolve(__dirname, "../models/*.ts")]
    }).then(connection => {
      this.debug(`Connection ${connection.name} is created successfully.`);
      return connection;
    });
  }

  private async getNextJsRequestHandler(mountPath: string) {
    const dev = process.env.NODE_ENV !== "production";
    const app = next({
      dev,
      dir: path.resolve(__dirname, "../../ui"),
      conf: {
        assetPrefix: mountPath,
        env: {
          mountPath
        }
      }
    });
    const handle = app.getRequestHandler();
    await app.prepare();
    return handle;
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
      .map(file => path.resolve(directory, file))
      .filter(filePath => fs.statSync(filePath).isFile())
      .map(filePath => {
        const taskDefinition = require(filePath).default;
        validateTaskDefinition(taskDefinition);
        const taskDefinitionFile: TaskDefinitionFile = {
          filePath,
          taskDefinition
        };
        return taskDefinitionFile;
      });
  }

  private async getApolloServerMiddleware() {
    const connection = await this.connectionPromise;
    // const redisPubSub = new RedisPubSub({
    //   publisher: this.redisClient,
    //   subscriber: this.redisClient
    // });
    const schema = await buildSchema({
      resolvers: [
        getTasksResolver(connection),
        getTasksRunResolver(connection, this)
      ]
      // pubSub: redisPubSub
    });
    const server = new ApolloServer({
      schema,
      playground: true,
      subscriptions: {
        onConnect(connectionParams, webSocket) {
          console.log({ connectionParams, webSocket });
        },
        path: path.join(this.options.mountPath, "/graphql/subscriptions")
      }
    });
    return server.getMiddleware({ path: "/graphql" });
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
        schedule: Not(TaskRun.InvocationType.MANUAL)
      }
    });
    const now = Date.now();
    for (const task of scheduledTasks) {
      const [lastTaskRun] = await taskRunRepository.find({
        where: { task, endTime: Not(IsNull()) },
        order: {
          endTime: "ASC"
        },
        take: 1
      });

      const scheduleMs = timestring(task.schedule, "ms");

      // Default to scheduling next run immoderately after now
      let expires = scheduleMs;

      // In case we found the last run, schedule after last run's end time to keep on schedule
      if (lastTaskRun) {
        const nextRun = parseInt(lastTaskRun.endTime, 10) + scheduleMs;

        if (nextRun < now) {
          // We are past due, schedule for immediate invocation
          expires = 1;
        } else {
          expires = nextRun - now;
        }
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
    // fire and forget
    this.redisClient.set(
      `${this.REDIS_TASK_SCHEDULE_PREFIX}${task.id}`,
      task.id,
      "PX",
      inMs
    );
  }

  private async onTaskScheduleKeyExpired(message: string) {
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
      taskRun.state = TaskRun.State.RUNNING;
      taskRun.invocationType = TaskRun.InvocationType.SCHEDULED;
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
    if (taskRun) {
      this.endTaskRun(TaskRun.State.TIMED_OUT, taskRun, undefined);
    }
  }

  /**
   * Every time Nice Commander boots, it will read all of task definition files and updates models
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
        name: taskDefinitionFile.taskDefinition.name
      });

      const task = existingTask || new Task();
      task.name = taskDefinitionFile.taskDefinition.name;
      task.timeoutAfter = taskDefinitionFile.taskDefinition.timeoutAfter;
      task.schedule = taskDefinitionFile.taskDefinition.schedule;
      task.code = fs.readFileSync(taskDefinitionFile.filePath).toString();

      await taskRepository.save(task);

      // TODO: handle deleted tasks
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

      taskRun.logsPath = `tasks/${taskRun.task.id}/${
        taskRun.id
      }_${Date.now()}.log`;

      // Start a child process
      const passThrough = new PassThrough();
      const upload = this.s3.upload({
        Bucket: this.s3BucketName,
        Key: taskRun.logsPath,
        Body: passThrough,
        ContentType: "text/plain"
      });

      // Add a Redis key for noticing when task run is timed out
      this.redisClient.set(
        `${this.REDIS_TASK_TIMEOUT_PREFIX}${taskRun.id}`,
        taskRun.id,
        "PX",
        taskRun.task.timeoutAfter
      );

      const child = cp.fork(
        this.invokeFile,
        [taskDefinitionFile.filePath, taskRun.payload],
        {
          stdio: "pipe"
        }
      );

      child.stdout?.pipe(passThrough);
      child.stderr?.pipe(passThrough);

      if (this.options.logToStdout) {
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      }

      child.on("exit", (code, signal) => {
        if (code === 0 && taskRun.state !== TaskRun.State.TIMED_OUT) {
          this.endTaskRun(TaskRun.State.FINISHED, taskRun, code, signal);
        } else {
          this.endTaskRun(TaskRun.State.ERROR, taskRun, code, signal);
        }
      });

      // Kill the child process if it takes more time than timeout to exit
      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGABRT");
        }
      }, taskRun.task.timeoutAfter);

      upload.send();

      // publishLogs(`${new Date()}`);
    } catch {
      // ignore failing to acquire a lock, this is task run is probably run by another host
    }
  }

  /**
   * Get express middleware to be mounted in your app
   *
   *    // Note: this method is asynchronous
   *    const middleware = await getExpressMiddleware();
   *    app.use('/admin/commander', middleware);
   */
  public async getExpressMiddleware() {
    const connection = await this.connectionPromise;

    // Sync task definitions
    await this.sync(this.taskDefinitionsFiles);

    // Schedule tasks
    await this.schedule();
    const router = Router();

    // API
    const middleware = await this.getApolloServerMiddleware();
    router.use(middleware);

    // UI
    const handler = await this.getNextJsRequestHandler(this.options.mountPath);
    router.all("*", (req, res) => handler(req, res));

    return router;
  }

  public async getLogsFromS3(logsPath: string) {
    const { Body } = await this.s3
      .getObject({
        Key: logsPath,
        Bucket: this.s3BucketName
      })
      .promise();

    return Body?.toString();
  }
}
