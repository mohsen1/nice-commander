import { TaskDefinition } from "../../../src";

// A simple manual task
const task: TaskDefinition = {
  name: "Simple Task",
  description:
    "This is a very simple task to demonstrate how to use Nice Commander. All it does is to print a few lines out to stdout",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    for (const i of Array.from({ length: 10 }, (_, ii) => ii)) {
      await wait(5);
      console.log(`Sample Task log ${i} -- payload name is ${payload?.name}`);
    }
  },
  timeoutAfter: "5 seconds",
  schedule: "manual",
};

export default task;
