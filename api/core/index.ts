import "reflect-metadata";
import path from "path";
import { Router } from "express";
import { buildSchema, Publisher, PubSubEngine } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import next from "next";
import { ConnectionOptions, createConnection, Connection } from "typeorm";
import debug from "debug";
import fs from "fs";
import { RedisPubSub } from "graphql-redis-subscriptions";
import redis from "redis";

import { getTasksResolver, getTasksRunResolver } from "../resolvers";
import { Task } from "../models/Task";
import { TaskRun } from "../models/TaskRun";
import ForkedProcess from "./ForkedProcess";
import { validateTaskDefinition, TaskDefinition } from "./TaskDefinition";

interface TaskDefinitionFile {
  taskDefinition: TaskDefinition;
  filePath: string;
}

export interface Options {
  /** Path to directory that contains all tasks. This path must be absolute */
  taskDefinitionsDirectory: string;

  /**
   * At what point this middleware is mounted?
   * This path can be relative but prefer absolute paths
   * This is used to make URLs of static assets used in UI
   */
  mountPath: string;

  /**
   * SQL connection configuration
   */
  sqlConnectionOptions: ConnectionOptions;

  /**
   * Redis connection configuration
   */
  redisConnectionOptions: {
    host: string;
    port: number;
  };
}

export default class NiceCommander {
  public DB_CONNECTION_NAME = `NiceCommander_${Math.random()
    .toString(36)
    .substring(2)}`;
  private taskDefinitionsFiles: TaskDefinitionFile[] = [];
  private connectionPromise!: Promise<Connection>;
  private logger = debug("nice-commander");

  constructor(private options: Options) {
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
    const server = new ApolloServer({ schema });
    return server.getMiddleware({ path: "/graphql" });
  }

  /**
   * Here we manage schedules of each task
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

    const payload = JSON.parse(taskRun.payload);

    taskRun.logs = `tasks/${taskRun.task.id}/${taskRun.id}_${Date.now()}.log`;

    const forkedProcess = new ForkedProcess({
      logKey: taskRun.logs,
      taskFilePath: taskDefinitionFile.filePath,
      payload
    });

    publishLogs(`${new Date()}`);

    forkedProcess.start();
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