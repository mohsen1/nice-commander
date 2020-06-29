import os from "os";

import { TaskDefinition } from "../../../src";

// A simple manual task
const task: TaskDefinition = {
  name: "JSON Logger",
  description: "This is a very simple task to demonstrate JSON logging",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    for (const i of Array.from({ length: 10 }, (_, ii) => ii)) {
      await wait(5);
      console.log(
        JSON.stringify({
          msg: `Simple Task log ${i} -- payload name is ${
            payload?.name ?? "Unknown"
          }`,
          ts: Date.now(),
          host: os.hostname(),
        })
      );
    }
  },
  timeoutAfter: "5 seconds",
  schedule: "manual",
  logEventSerializer(event) {
    const log = JSON.parse(event.message ?? "{}");
    return `${new Date(log.ts).toISOString()} :: ${log.host} > ${log.msg}\n`;
  },
};

export default task;
