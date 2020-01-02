import { getConnection } from "typeorm";

import { TaskDefinition, DB_CONNECTION_NAME } from ".";
import { Task } from "../models/Task";

export default async function sync(taskDefinitions: TaskDefinition[]) {
  const connection = getConnection(DB_CONNECTION_NAME);
  const taskRepository = connection.getRepository(Task);

  // Sync incoming task definitions to database
  for (const taskDefinition of taskDefinitions) {
    const existingTask = await taskRepository.findOne({
      name: taskDefinition.name
    });

    const task = existingTask || new Task();
    task.name = taskDefinition.name;
    task.timeoutAfter = taskDefinition.timeoutAfter;
    task.schedule = taskDefinition.schedule;

    await taskRepository.save(task);

    // TODO: handle deleted tasks
  }
}
