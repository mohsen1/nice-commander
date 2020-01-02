import { getConnection, Between } from "typeorm";

import { DB_CONNECTION_NAME } from ".";
import { Task } from "../models/Task";

/**
 * @fileOverview
 *
 * Here we manage schedules of each task
 */

export default async function schedule() {
  const connection = getConnection(DB_CONNECTION_NAME);
  const taskRepository = connection.getRepository(Task);

  const allTasks = await taskRepository.find({ take: Number.MAX_SAFE_INTEGER });
  for (const task of allTasks) {
    if (task.schedule !== "manual") {
      // Redis stuff here
    }
  }
}
