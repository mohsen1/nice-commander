# Nice Commander

![CI](https://github.com/mohsen1/nice-commander/workflows/CI/badge.svg)

NiceCommander runs scheduled and one-off tasks in your Node.js server with a nice UI

## Quick Start

### Requirements

- **Redis Server** for distributed locking
- **MySQL Server** for its task and task-run database
- **Amazon CloudWatch Logs Access** to store logs

### Define your tasks

Create a directory dedicated to your tasks. Create one or many files that export task definitions. Task definitions must conform to the `TaskDefinition` TypeScript interface.

```javascript
// tasks/simple.js
/**
 * Using JSDoc you can type the exported task
 * @type {import("nice-commander").TaskDefinition}
 */
module.exports = {
  name: "my-task",
  async run() {
    console.log("my-task is running");
  },
  timeoutAfter: "2 seconds",
};
```

> If you are using TypeScript you can import the `TaskDefinition` interface and type your task default export with it.

### Add NiceCommander to your Express server

NiceCommander is an Express middleware. Create an instance of `NiceCommander` and pass required configurations for MySQL and Redis as well as the path you want the UI to be accessible from under `mountPath`.

```javascript
import express from "express";
import path from "path";
import AWS from "aws-sdk";
import { createMiddleware } from "nice-commander";

const app = express();

const mountPath = "/nice-commander";
const { middleware } = createMiddleware({
  taskDefinitionsDirectory: path.resolve(__dirname, "tasks"),
  mountPath,
  redisConnectionOptions: {
    /* Redis Config */
  },
  sqlConnectionOptions: {
    /* DB Config */
  },
  awsRegion: "us-east-2",
  awsCredentials: new AWS.Credentials({
    accessKeyId: "xxx",
    secretAccessKey: "xxx",
  }),
});
app.use(mountPath, middleware);

app.listen(3000);
```
