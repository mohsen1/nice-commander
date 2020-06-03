import { TaskDefinition } from "../../../src";

// A simple scheduled task
const task: TaskDefinition = {
  name: "Scheduled Simple Task",
  async run() {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    for (const i of Array.from({ length: 10 }, (_, ii) => ii)) {
      await wait(5);
      console.log(`Scheduled Simple Task log ${i}`);
    }
  },
  timeoutAfter: "5 seconds",
  schedule: "20 minute",
};

export default task;
