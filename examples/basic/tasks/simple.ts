import { TaskDefinition } from "../../../api/core/index";

// A simple manual task
const task: TaskDefinition = {
  name: "Sample Task",
  async run() {
    const wait = (amount: number) =>
      new Promise(resolve => setTimeout(resolve, amount));

    for (let i of Array.from({ length: 10 }, (_, ii) => ii)) {
      await wait(5);
      console.log(`Sample Tak log ${i}`);
    }
  },
  timeoutAfter: 100,
  schedule: "manual"
};

export default task;
