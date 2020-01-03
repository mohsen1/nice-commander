const taskFile = process.argv[2];
const payload = JSON.parse(process.argv[3]);
const taskDefinition = require(taskFile).default;

taskDefinition.run(payload);

export {};
