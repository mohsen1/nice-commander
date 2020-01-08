import "reflect-metadata";
import path from "path";
import { Router } from "express";
import { buildSchema, Publisher } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import next from "next";
import { createConnection, Connection } from "typeorm";
import debug from "debug";
import fs from "fs";
import { RedisPubSub } from "graphql-redis-subscriptions";
import redis from "redis";
import cp from "child_process";
import AWS from "aws-sdk";
import { PassThrough } from "stream";

import { getTasksResolver, getTasksRunResolver } from "../resolvers";
import { Task } from "../models/Task";
import { TaskRun } from "../models/TaskRun";
import { validateTaskDefinition, TaskDefinition } from "./TaskDefinition";
import { Options } from "./Options";

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
  public readonly DB_CONNECTION_NAME = `NiceCommander_${Math.random()
    .toString(36)
    .substring(2)}`;
  private readonly taskDefinitionsFiles: TaskDefinitionFile[] = [];
  private readonly connectionPromise!: Promise<Connection>;
  private readonly logger = debug("nice-commander");
  private readonly invokeFile = path.resolve(__dirname, "./invoke");
  private readonly s3 = new AWS.S3({ apiVersion: "2006-03-01" });
  private readonly childProcesses = new Map<string, cp.ChildProcess>();

  public constructor(private options: Options) {
    this.taskDefinitionsFiles = this.readTaskDefinitions(
      options.taskDefinitionsDirectory
    );

    // Create the DB connection
    this.connectionPromise = createConnection({
      ...options.sqlConnectionOptions,
      name: this.DB_CONNECTION_NAME,
      synchronize: true,
      logging: false,
      entities: [path.resolve(__dirname, "../models/*.ts")]
    }).then(connection => {
      this.logger(`Connection ${connection.name} is created successfully.`);
      return connection;
    });
  }

  private async getNextJsRequestHandler(assetPrefix: string) {
    const dev = process.env.NODE_ENV !== "production";
    const app = next({
      dev,
      dir: path.resolve(__dirname, "../../ui"),
      conf: { assetPrefix }
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
    const redisPubSub = new RedisPubSub({
      publisher: redis.createClient({
        host: this.options.redisConnectionOptions.host,
        port: this.options.redisConnectionOptions.port
      }),
      subscriber: redis.createClient({
        host: this.options.redisConnectionOptions.host,
        port: this.options.redisConnectionOptions.port
      })
    });
    const schema = await buildSchema({
      resolvers: [
        getTasksResolver(connection),
        getTasksRunResolver(connection, this)
      ],
      pubSub: redisPubSub
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
   *
   * @todo with Redis locking this will be very different
   */
  private async schedule() {
    const connection = await this.connectionPromise;
    const taskRepository = connection.getRepository(Task);

    const allTasks = await taskRepository.find({
      // TODO: paginate
      take: Number.MAX_SAFE_INTEGER
    });
    for (const task of allTasks) {
      if (task.schedule !== "manual") {
        // Redis stuff here
      }
    }
  }

  /**
   * Every time Nice Commander boots, it will read all of task definition files and updates models
   * in the database accordingly . We rely on definition name to find corresponding model in our
   * database
   *
   * @param taskDefinitions List of task definition files
   */
  private async sync(taskDefinitions: TaskDefinition[]) {
    const connection = await this.connectionPromise;
    const taskRepository = connection.getRepository(Task);

    // Sync incoming task definitions to database
    for (const taskDefinition of taskDefinitions) {
      const existingTask = await taskRepository.findOne({
        name: taskDefinition.name
      });

      const task = existingTask || new Task();
      task.name = taskDefinition.name;
      task.timeoutAfter = taskDefinition.timeoutAfter;
      task.schedule = taskDefinition.schedule;

      await taskRepository.save(task);

      // TODO: handle deleted tasks
    }
  }

  /** Do the business of ending life of a task run */
  private async endTaskRun(state: "FINISHED" | "ERROR", taskRun: TaskRun) {
    const connection = await this.connectionPromise;
    const taskRunRepository = connection.getRepository(TaskRun);

    taskRun.state = state;
    await taskRunRepository.save(taskRun);
    this.childProcesses.delete(taskRun.uniqueId);
  }

  /**
   * Start a task with a given task run
   * @param taskRun The TaskRun model instance. This TaskRun instance should be set in the state of "RUNNING"
   * @param publishLogs Logging pub-sub
   */
  public async startTask(taskRun: TaskRun, publishLogs: Publisher<string>) {
    const taskDefinitionFile = this.taskDefinitionsFiles.find(
      ({ taskDefinition }) => taskDefinition.name === taskRun.task.name
    );

    if (!taskRun) {
      throw new Error("Can not find task run model");
    }

    if (!taskDefinitionFile) {
      throw new Error("Can not find task definition");
    }

    taskRun.logs = `tasks/${taskRun.task.id}/${taskRun.id}_${Date.now()}.log`;

    // Start a child process
    const passThrough = new PassThrough();
    const upload = this.s3.upload({
      Bucket: "nice-commander",
      Key: taskRun.logs,
      Body: passThrough,
      ContentType: "text/plain"
    });

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

    this.childProcesses.set(taskRun.uniqueId, child);

    child.on("close", () => this.endTaskRun("FINISHED", taskRun));
    child.on("error", () => this.endTaskRun("ERROR", taskRun));

    upload.send();

    publishLogs(`${new Date()}`);
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
    await this.sync(
      this.taskDefinitionsFiles.map(({ taskDefinition }) => taskDefinition)
    );

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
}
