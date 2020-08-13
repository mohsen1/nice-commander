import { TaskDefinition } from "../../../src";

// A simple manual task
const task: TaskDefinition = {
  name: "Big Error",
  description: "This task outputs a big error before exiting",
  async run() {
    console.log("Starting....");
    console.log("About to throw an error");
    const errorMessage = Array.from({ length: 100 })
      .map(() => Math.random().toString(36))
      .concat("End of error message")
      .join("\n");

    throw new Error(errorMessage);
  },
  timeoutAfter: "2 minutes",
  schedule: "manual",
};

export default task;
