import { TaskDefinition } from "../../../src";

// A simple manual task that times out
const task: TaskDefinition = {
  name: "Errors Out",
  async run(payload) {
    const wait = (amount: number) =>
      new Promise(resolve => setTimeout(resolve, amount));
    console.info("Starting at", Date.now());
    await wait(parseInt(payload.wait || "1000", 10));
    const code = parseInt(payload.exitCode || "1", 10);
    console.error("Exiting with exit code", code, "on", Date.now());
    process.exit(code);
  },
  timeoutAfter: 60 * 1000,
  schedule: "manual"
};

export default task;
