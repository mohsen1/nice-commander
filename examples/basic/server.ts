/**
 * @fileOverview
 *
 * This file is just to try out the middleware
 */

import express from "express";
import path from "path";
import config from "config";
import AWS from "aws-sdk";
import treeKill from "tree-kill";

const awsCredentials = new AWS.SharedIniFileCredentials({
  profile: config.get("aws-profile"),
});

import { createMiddleware } from "../../src/api/core";

const app = express();

// Fake user provider
app.use((req, res, next) => {
  req.user = {
    name: "Test User",
    email: "test@example.com",
  };
  next();
});

app.get("/", (_, res) =>
  res.status(200).send(`Go to <a href="${mountPath}">${mountPath}</a>`)
);

const mountPath = "/nice-commander";
const { middleware, startTask } = createMiddleware({
  awsRegion: "us-east-2",
  awsCredentials,
  mountPath,
  redisConnectionOptions: config.get("redis"),
  awsCloudWatchLogsLogGroupName: "NiceCommander",
  sqlConnectionOptions: {
    type: "mysql",
    // eslint-disable-next-line @typescript-eslint/ban-types
    ...config.get<object>("db"),
  },
  taskDefinitionsDirectory: path.resolve(__dirname, "tasks"),
  readonlyMode: false,
});

app.use(mountPath, middleware);

// Demonstration of programmatic invocation
// Try running:
// curl -X POST http://localhost:3000/run/Simple%20Task
app.post("/run/:name", (req, res) => {
  const name = req.params["name"];
  console.log("Starting task programmatically. Task name:", name);
  startTask(name)
    .then(() => {
      res.status(200).send("Successfully started task");
    })
    .catch((err) => {
      res.status(500).send(err.stack);
    });
});

const server = app.listen(3000, () =>
  console.info("Server is listening on http://localhost:3000")
);

process.once("SIGUSR2", () => {
  server.close((err) => {
    if (err) {
      console.error("Failed to close the Express server");
      console.error(err);
    } else {
      console.log("Closed the Express server.");
    }

    console.log("Now killing sub-processes");

    treeKill(process.pid, "SIGUSR2", (err) => {
      if (err) {
        console.error("Failed to kill sub-processes");
        console.error(err);
      } else {
        console.log("Done killing all sub-processes");
      }
      process.kill(process.pid);
      process.abort();
    });
  });
});
