/**
 * @fileOverview
 *
 * This file is used by NiceCommander child process management system to invoke tasks in isolation
 * from the main process.
 *
 * It takes two arguments
 *
 * 1. taskFile: path to the task file
 * 2. payload: a JSON payload to send to task's `run` method
 *
 * You can try out this file by invoking it via `node` executable and passing required arguments
 */

function requireTaskDefinition(filePath: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(filePath);

  if (typeof module.run === "function") {
    return module;
  }

  if (typeof module?.default?.run === "function") {
    return module.default;
  }

  throw new Error(`Task definition at ${filePath} is not valid`);
}

const taskFile = process.argv[2];
const payload = JSON.parse(process.argv[3]);
const taskDefinition = requireTaskDefinition(taskFile);

taskDefinition.run(payload);

export {};
