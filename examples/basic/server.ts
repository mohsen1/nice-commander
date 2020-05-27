/**
 * @fileOverview
 *
 * This file is just to try out the middleware
 */

import express from "express";
import path from "path";
import config from "config";
import AWS from "aws-sdk";

const awsCredentials = new AWS.SharedIniFileCredentials({
  profile: config.get("aws-profile"),
});

import NiceCommander from "../../src/api/core";

async function main() {
  const app = express();

  const mountPath = "/nice-commander";

  app.get("/", (req, res) => res.status(200).send(`Go to ${mountPath}`));

  const niceCommander = new NiceCommander({
    awsRegion: "us-east-2",
    awsCredentials,
    mountPath,
    redisConnectionOptions: config.get("redis"),
    sqlConnectionOptions: {
      type: "mysql",
      ...config.get("db"),
    },
    taskDefinitionsDirectory: path.resolve(__dirname, "tasks"),
  });
  const middleware = await niceCommander.getExpressMiddleware();
  app.use(mountPath, middleware);

  app.listen(3000);
}

main()
  .catch(console.error)
  .then(() => console.info("Server is listening on http://localhost:3000"));
