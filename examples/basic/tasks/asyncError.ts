import { TaskDefinition } from "../../../src";

// A simple manual task that errors out
const task: TaskDefinition = {
  name: "Errors Out (Async)",
  async run(payload: unknown) {
    const wait = (amount: number) =>
      new Promise((resolve) => setTimeout(resolve, amount));

    console.info("Starting at", Date.now());

    await wait(1000);

    Promise.reject(new Error("Async Error"));
  },
  timeoutAfter: "1 minute",
  schedule: "manual",
  unhandledRejections: "strict",
};

export default task;
