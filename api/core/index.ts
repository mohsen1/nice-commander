import "reflect-metadata";
import path from "path";
import { Router } from "express";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import next from "next";
import { ConnectionOptions, createConnection, Connection } from "typeorm";
import debug from "debug";
import fs from "fs";

import { getTasksResolver, getTasksRunResolver } from "../resolvers";
import { Task } from "../models/Task";
import { TaskRun } from "../models/TaskRun";
import ForkedProcess from "./ForkedProcess";

export interface TaskDefinition {
  /** Task name must be unique */
  name: string;

  /** Run function. This function is asynchronous */
  run: () => Promise<void>;

  /** Maximum time this task can run */
  timeoutAfter: number;
  /**
   * Time string or "manual"
   * @see https://www.npmjs.com/package/timestring
   */
  schedule: "manual" | string;
}

export interface Options {
  /** List of task definitions */
  taskDefinitions: TaskDefinition[];

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
}

export default class NiceCommander {
  public DB_CONNECTION_NAME = `NiceCommander_${Math.random()
    .toString(36)
    .substring(2)}`;
  private connectionPromise!: Promise<Connection>;
  private logger = debug("nice-commander");

  /**
   * Read tasks definitions from a directory
   * @param directory The path where tasks are stored at.
   *
   */
  public static readTaskDefinitions(directory: string): TaskDefinition[] {
    if (!directory.startsWith("/")) {
      throw new Error("directory path must be absolute");
    }

    return fs.readdirSync(directory).map(file => {
      const filePath = path.resolve(directory, file);
      if (fs.statSync(filePath).isFile()) {
        const taskDefinition = require(filePath).default;
        validateTaskDefinition(taskDefinition);
        return taskDefinition;
      }
    });
  }

  constructor(private options: Options) {
    // TODO: enforce task definition names are unique

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

  private async getApolloServerMiddleware() {
    const connection = await this.connectionPromise;
    const schema = await buildSchema({
      resolvers: [
        getTasksResolver(connection),
        getTasksRunResolver(connection, this)
      ]
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

  public async startTask(taskRun: TaskRun) {
    const taskDefinition = this.options.taskDefinitions.find(
      ({ name }) => name === taskRun.task.name
    );
    const connection = await this.connectionPromise;
    const taskRunRepository = connection.getRepository(TaskRun);
    const taskModel = await taskRunRepository.findOne({
      where: { name: taskRun.task.name }
    });

    if (!taskModel) {
      throw new Error("Can not find task model");
    }

    if (!taskDefinition) {
      throw new Error("Can not find task definition");
    }

    const forkedProcess = new ForkedProcess(
      "/Users/mohsen_azimi/Code/nice-commander/examples/basic/tasks/simple.ts",
      {},
      (logChunk: string) => {
        console.info("ForkedProcess Log:", logChunk);
      },
      () => {
        taskRun.state = "FINISHED";
        taskRunRepository.save(taskRun);
      },
      () => {
        taskRun.state = "ERROR";
        taskRunRepository.save(taskRun);
      }
    );

    forkedProcess.start();

    await taskRunRepository.save(taskModel);
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
    await this.sync(this.options.taskDefinitions);

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

export class TaskDefinitionValidationError extends Error {}

export function validateTaskDefinition(
  taskDefinition: Partial<TaskDefinition>
): taskDefinition is TaskDefinition {
  if (!taskDefinition.name) {
    throw new TaskDefinitionValidationError("name is required");
  }
  if (typeof taskDefinition.name !== "string") {
    throw new TaskDefinitionValidationError("name must be a string");
  }
  if (!taskDefinition.timeoutAfter) {
    throw new TaskDefinitionValidationError("timeoutAfter is required");
  }
  if (typeof taskDefinition.run !== "function") {
    throw new TaskDefinitionValidationError("run must be a function");
  }
  return true;
}
