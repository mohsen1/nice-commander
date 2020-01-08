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
const taskFile = process.argv[2];
const payload = JSON.parse(process.argv[3]);
const taskDefinition = require(taskFile).default;

taskDefinition.run(payload);

export {};
