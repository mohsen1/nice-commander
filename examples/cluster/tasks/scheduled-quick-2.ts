import { TaskDefinition } from "../../../src";

// A simple manual task
const task: TaskDefinition = {
  name: "Scheduled Quick 2",
  description: "Very frequent but completes quickly",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    await wait(1000);
    for (let i = 0; i < 1000; i++) {
      console.log(Math.random().toString(36).repeat(30));
    }
    await wait(1000);
    console.log("Done");
  },
  timeoutAfter: "5 seconds",
  schedule: "45 seconds",
};

export default task;
