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

import { createMiddleware } from "../../src/api/core";

const app = express();

app.get("/", (_, res) =>
  res.status(200).send(`Go to <a href="${mountPath}">${mountPath}</a>`)
);

const mountPath = "/nice-commander";
const middleware = createMiddleware({
  awsRegion: "us-east-2",
  awsCredentials,
  mountPath,
  redisConnectionOptions: config.get("redis"),
  sqlConnectionOptions: {
    type: "mysql",
    ...config.get<object>("db"),
  },
  taskDefinitionsDirectory: path.resolve(__dirname, "tasks"),
});

app.use(mountPath, middleware);

app.listen(3000, () =>
  console.info("Server is listening on http://localhost:3000")
);
