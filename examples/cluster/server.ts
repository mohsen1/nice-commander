import express from "express";
import path from "path";
import config from "config";
import AWS from "aws-sdk";

const awsCredentials = new AWS.SharedIniFileCredentials({
  profile: config.get("aws-profile"),
});

import { createMiddleware } from "../../src/api/core";

const app = express();

const mountPath = "/cluster";
const { middleware } = createMiddleware({
  awsRegion: "us-east-2",
  awsCredentials,
  mountPath,
  redisConnectionOptions: config.get("redis"),
  awsCloudWatchLogsLogGroupName: "NiceCommander",
  sqlConnectionOptions: {
    type: "mysql",
    // eslint-disable-next-line @typescript-eslint/ban-types
    ...config.get<object>("db"),
    name: "cluster_nice_commander",
  },
  taskDefinitionsDirectory: path.resolve(__dirname, "tasks"),
  // Synching DB in cluster mode can cause issues with TypeORM
  synchronizeDB: false,
});
app.use(mountPath, middleware);

app.listen(3000, () =>
  console.info(
    `[pid=${process.pid}] Worker is listening on http://localhost:3000`
  )
);
