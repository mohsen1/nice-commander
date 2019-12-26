/**
 * @fileOverview
 * 
 * This file is just to try out the middleware
 */

import express from "express";

import { getExpressMiddleware } from ".";

async function main() {
  const app = express();

  app.get("/foo", (req, res) => res.status(200).send("OK"));

  const mountedPath = "/nice-commander";
  const middleware = await getExpressMiddleware({
    mountedPath,
    sqlConnectionOptions: {
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      database: "nicecommander"
    }
  });
  app.use(mountedPath, middleware);

  app.listen(3000);
}

main().catch(console.error);
