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

## How it works?

This section explains the internals of NiceCommander. If you are just looking to use it, you can skip this section.

### Glossary

- **Task Definition** A task definition is a JavaScript object that defines a task. It has a name, a run function, and other metadata.
- **Run** A run is an execution of a task definition. It has a start time, an end time, and a status.
- **Payload** A payload is a JSON object that is passed to a task definition's run function.
- **Log** Output of a task definition's run function is stored as a log.

### State management

Nice Commander uses a SQL database to manage the list of tasks, state of each task and the list of runs for each task. In our example we are using MySQL.

On boot, Nice Commander will create a database row for each task definition found in the `taskDefinitionsDirectory`. It will also create a database row for each run of each task definition.

### Locking

Nice Commander uses Redis to manage distributed locking. Distributed locking is required to prevent multiple instances of the same task from running at the same time.

### Log management

Nice Commander uses Amazon CloudWatch Logs to store logs. Real time logs of each task run are first piped into AWS CloudWatch Logs and then streamed to the UI. This might result in delay in the logs being available in the UI but it is a tradeoff we are willing to make to avoid losing log data.

### Task scheduling

Nice Commander uses a combination of Redis and SQL to manage task scheduling. It uses Redis to store the next run time of each task and SQL to store the last run time of each task. When a task is scheduled to run, Nice Commander will check if the task is locked. If it is not locked, it will lock it and run it. If it is locked, it will check if the task is overdue. If it is overdue, it will run it. If it is not overdue, it will schedule it to run again in the future.

### Task running

When a task is run, Nice Commander will create a new run row in the database and start streaming logs to AWS CloudWatch Logs. When the task is done, Nice Commander will update the run row in the database and stop streaming logs to AWS CloudWatch Logs.

### Process management

Runs are essentially child processes of the Nice Commander process. When a run is created, Nice Commander will fork a child process and run the task definition's run function in it. When the run is done, Nice Commander will kill the child process in case it was not exited by the task definition's run function. Timeouts are scheduled using Redis to ensure no task runs forever.

Since the callback of a run's timeout call might be invoked in a host that is not running that task, each host will try to find if the child process is running on it and kill it if it is.
