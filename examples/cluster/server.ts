import express from "express";
import path from "path";
import config from "config";
import os from "os";
import cluster from "cluster";
import AWS from "aws-sdk";

const awsCredentials = new AWS.SharedIniFileCredentials({
  profile: config.get("aws-profile"),
});

import { createMiddleware } from "../../src/api/core";

if (cluster.isMaster) {
  console.log(`[pid=${process.pid}] Master is running`);

  // Fork workers.
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  const app = express();

  const mountPath = "/";
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
  });
  app.use(mountPath, middleware);

  app.listen(3000, () =>
    console.info(
      `[pid=${process.pid}] Worker is listening on http://localhost:3000`
    )
  );
}
