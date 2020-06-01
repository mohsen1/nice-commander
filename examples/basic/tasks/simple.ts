import { TaskDefinition } from "../../../src";

// A simple manual task
const task: TaskDefinition = {
  name: "Sample Task",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    for (const i of Array.from({ length: 10 }, (_, ii) => ii)) {
      await wait(5);
      console.log(`Sample Tak log ${i} -- payload name is ${payload?.name}`);
    }
  },
  timeoutAfter: "5 seconds",
  schedule: "manual",
};

export default task;
