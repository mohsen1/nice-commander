# Nice Commander

NiceCommander run scheduled and one-off tasks in your Node.js server with a nice UI

## Quick Start

### Requirements

NiceCommander requires:

- **Redis Server** for distributed locking
- **MySQL Server** for its task and task-run database
- **Amazon S3 Access** to store logs

### Installation

Install NiceCommander via npm or Yarn

```bash
npm install nice-commander
```

### Usage

#### Define your tasks

Create a directory dedicated to your tasks. Create one or many files that export task definitions. Task definitions must conform to the `TaskDefinition` TypeScript interface.

```javascript
// tasks/simple.js
/**
 * Using JSDoc you can type the exported file
 * @type {import("nice-commander").TaskDefinition}
 */
module.exports.default = {
  name: "my-task",
  async run() {
    console.log("my-task is running");
  },
  timeoutAfter: 1000
};
```

> If you are using TypeScript you can import the `TaskDefinition` interface and type your task default export with it.

#### Add NiceCommander to your server

NiceCommander is an Express middleware. Create an instance of `NiceCommander` and pass required configurations for MySQL and Redis as well as the path you want the UI to be accessible from under `mountPath`.

```javascript
import express from "express";
import path from "path";
import NiceCommander from "nice-commander";

const app = express();

const mountPath = "/nice-commander";
const niceCommander = new NiceCommander({
  taskDefinitionsDirectory: path.resolve(__dirname, "tasks"),
  mountPath,
  redisConnectionOptions: {
    /* Redis Config */
  },
  sqlConnectionOptions: {
    /* DB Config */
  }
});
const middleware = await niceCommander.getExpressMiddleware();
app.use(mountPath, middleware);

app.listen(3000);
```

## Work in progress

This project is not ready for any sort of use yet.

See Github Project for 1.0 for more information.
