import { Resolver, Query, Arg, Int, Mutation } from "type-graphql";
import { getConnection } from "typeorm";

import { DB_CONNECTION_NAME } from "../core";
import { assertNumberArgumentIsInRange } from "../util";
import { TaskRun } from "../models/TaskRun";
import { Task } from "../models/Task";

@Resolver(TaskRun)
export class TasksRunResolver {
  private get repository() {
    const connection = getConnection(DB_CONNECTION_NAME);
    const taskRunRepository = connection.getRepository(TaskRun);
    return taskRunRepository;
  }

  private get taskRepository() {
    const connection = getConnection(DB_CONNECTION_NAME);
    const taskRepository = connection.getRepository(Task);
    return taskRepository;
  }

  @Mutation(returns => Boolean)
  async runTask(@Arg("taskName", type => String) taskName: string) {
    const [task] =
      (await this.taskRepository.find({ where: { name: taskName } })) || [];

    if (!task) {
      throw new Error(`Task with name ${taskName} was not found`);
    }

    const taskRun = new TaskRun();
    taskRun.task = task;

    await this.repository.save(taskRun);

    return true;
  }
}
