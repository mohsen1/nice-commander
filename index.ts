import "reflect-metadata";
import path from "path";
import { Router } from "express";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import next from "next";
import { ConnectionOptions, createConnection } from "typeorm";
import debug from 'debug';

import { TasksResolver } from "./api/resolvers/TasksResolver";

export const logger = debug('nice-commander');

export const DB_CONNECTION_NAME = `NiceCommander_${Math.random().toString(36).substring(2)}`

export async function getNextJsRequestHandler(assetPrefix: string) {
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({
    dev,
    dir: path.resolve(__dirname, "ui"),
    conf: { assetPrefix }
  });
  const handle = app.getRequestHandler();
  await app.prepare();
  return handle;
}

export async function getApolloServerMiddleware() {
  const schema = await buildSchema({
    resolvers: [TasksResolver]
  });
  const server = new ApolloServer({ schema });
  return server.getMiddleware({ path: "/graphql" });
}

export interface Options {
  /** 
   * At what point this middleware is mounted?
   * This path can be relative but prefer absolute paths
   * This is used to make URLs of static assets used in UI
   */
  mountPath: string;
  sqlConnectionOptions: ConnectionOptions;
}

/**
 * Get express middleware to be mounted in your app
 *
 *    // Note: this method is asynchronous
 *    const middleware = await getExpressMiddleware();
 *    app.use('/admin/commander', middleware);
 */
export async function getExpressMiddleware(options: Options) {
  const router = Router();

  const connection = await createConnection({
    ...options.sqlConnectionOptions,
    name: DB_CONNECTION_NAME,
    synchronize: true,
    logging: false,
    entities: [path.resolve(__dirname, "api/models/*.ts")]
  });

  logger(`Connection ${connection.name} is created successfully.`);

  // API
  const middleware = await getApolloServerMiddleware();
  router.use(middleware);

  // UI
  const handler = await getNextJsRequestHandler(options.mountPath);
  router.all("*", (req, res) => handler(req, res));

  return router;
}
