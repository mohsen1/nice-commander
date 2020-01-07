/**
 * @fileOverview
 *
 * This file is just to try out the middleware
 */

import express from "express";
import path from "path";

import NiceCommander from "../..";

async function main() {
  const app = express();

  app.get("/foo", (req, res) => res.status(200).send("OK"));

  const mountPath = "/nice-commander";
  const niceCommander = new NiceCommander({
    mountPath,
    redisConnectionOptions: {
      host: "localhost",
      port: 6379
    },
    sqlConnectionOptions: {
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      database: "nicecommander"
    },
    taskDefinitionsDirectory: path.resolve(__dirname, "tasks")
  });
  const middleware = await niceCommander.getExpressMiddleware();
  app.use(mountPath, middleware);

  app.listen(3000);
}

main().catch(console.error);
