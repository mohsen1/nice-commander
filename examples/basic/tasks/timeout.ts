import { TaskDefinition } from "../../../src";

// A simple manual task that always times out
const task: TaskDefinition = {
  name: "Times Out",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    console.log("This task will time out before finishing");
    console.log("Date and time is", new Date());
    console.log("Epoch time is", Date.now());
    await wait(10 * 1000);
    console.log("Task finished -- this should never happen!");
  },
  timeoutAfter: 1000,
  schedule: "manual",
};

export default task;
