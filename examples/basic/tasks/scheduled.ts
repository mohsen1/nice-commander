import { TaskDefinition } from "../../../src";

// A simple scheduled task
const task: TaskDefinition = {
  name: "Scheduled Sample Task",
  async run() {
    const wait = (amount: number) =>
      new Promise(resolve => setTimeout(resolve, amount));

    for (let i of Array.from({ length: 10 }, (_, ii) => ii)) {
      await wait(5);
      console.log(`Scheduled Sample Tak log ${i}`);
    }
  },
  timeoutAfter: 100,
  schedule: "2 minute"
};

export default task;
