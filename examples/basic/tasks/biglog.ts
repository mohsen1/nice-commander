import fs from "fs";
import os from "os";

import { TaskDefinition } from "../../../src";
import { promisify } from "util";

// A simple manual task
const task: TaskDefinition = {
  name: "Big Logger",
  description: "This task outputs lots of logs",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));
    const dicLocation = payload.dicLocation || "/usr/share/dict/words";
    const lines = payload.lines || 100_000;
    const words = (await promisify(fs.readFile)(dicLocation))
      .toString()
      .split(os.EOL);
    const wordCount = words.length - 1;
    for (let i = 0; i < lines; i++) {
      const randomWords = Array.from({ length: 10 }).map(
        () => words[Math.round(Math.random() * wordCount)]
      );
      console.log(...randomWords);
      await wait(1);
    }
    await wait(10 * 1000);
  },
  timeoutAfter: "2 minutes",
  schedule: "manual",
};

export default task;
