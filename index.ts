import "reflect-metadata";
import path from "path";
import { Router } from "express";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import next from "next";
import { ConnectionOptions, createConnection } from "typeorm";

import { TasksResolver } from "./resolvers/TasksResolver";

export async function getNextJsRequestHandler() {
  const app = next({ dev: true, conf: {assetPrefix: '/nice-commander/' }});
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
    synchronize: true,
    logging: false,
    entities: [path.resolve(__dirname, "models/*.ts")]
  });

  console.info(`Connection ${connection.name} is created successfully.`);

  // API
  const middleware = await getApolloServerMiddleware();
  router.use(middleware);

  // UI
  const handler = await getNextJsRequestHandler();
  router.all("*", (req, res) => handler(req, res));

  return router;
}
