import crypto from "crypto";

import { TaskDefinition } from "../../../src";
import { promisify } from "util";

const randomBytes = promisify(crypto.randomBytes);

// A simple manual task
const task: TaskDefinition = {
  name: "Long Scheduled Task",
  description: "This task does a long time to complete (about 3 minutes)",
  async run() {
    for (const i of Array.from({ length: 100 }, (_, ii) => ii)) {
      await randomBytes(1024);
      console.log(`${i} generated random bytes`);
    }
  },
  timeoutAfter: "3 minutes",
  schedule: "3 minutes",
};

export default task;
