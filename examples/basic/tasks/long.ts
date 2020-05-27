import { TaskDefinition } from "../../../src";

// A simple manual task that takes 3 minutes to run
const task: TaskDefinition = {
  name: "Long Running Task",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    const minutes = parseFloat(String(payload.minutes)) || 3;
    const start = Date.now();
    const end = start + minutes * 60 * 1000;

    console.log("This task will be done in", minutes, "minutes");

    while (Date.now() < end) {
      await wait(100);
      console.log(
        `This task has been running for ${Date.now() - start} milliseconds`
      );
    }
    console.log("Done in", new Date(), "ts=", Date.now());
  },
  // Add a little more for the timeout because console.log is sync
  timeoutAfter: 3 * 60 * 1000 + 200,
  schedule: "manual",
};

export default task;
