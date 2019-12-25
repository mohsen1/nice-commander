import "reflect-metadata";
import { Router } from "express";
import { buildSchema } from "type-graphql";
import { TasksResolver } from "./resolvers/TasksResolver";
import { ApolloServer } from "apollo-server-express";
import next from "next";

export async function getNextJsRequestHandler() {
  const app = next({ dev: true });
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

/**
 * Get express middleware to be mounted in your app
 *
 *    // Note: this method is asynchronous
 *    const middleware = await getExpressMiddleware();
 *    app.use('/admin/commander', middleware);
 */
export async function getExpressMiddleware() {
  const router = Router();

  // API
  const middleware = await getApolloServerMiddleware();
  router.use(middleware);

  // UI
  const handler = await getNextJsRequestHandler();
  router.all("*", (req, res) => handler(req, res));

  return router;
}
