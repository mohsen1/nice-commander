import { Resolver, Query, Arg, Int, Mutation } from "type-graphql";
import { Connection } from "typeorm";

import { TaskRun } from "../models/TaskRun";
import { Task } from "../models/Task";
import NiceCommander, { TaskDefinition } from "../core";

export function getTasksRunResolver(
  connection: Connection,
  niceCommander: NiceCommander
) {
  @Resolver(TaskRun)
  class TasksRunResolver {
    private get repository() {
      const taskRunRepository = connection.getRepository(TaskRun);
      return taskRunRepository;
    }

    private get taskRepository() {
      const taskRepository = connection.getRepository(Task);
      return taskRepository;
    }

    @Mutation(returns => TaskRun)
    async runTask(@Arg("taskName", type => String) taskName: string) {
      const [task] =
        (await this.taskRepository.find({ where: { name: taskName } })) || [];

      if (!task) {
        throw new Error(`Task with name ${taskName} was not found`);
      }

      const taskRun = new TaskRun();
      taskRun.task = task;
      taskRun.startTime = Date.now();
      taskRun.state = "RUNNING";

      // Save to DB
      await this.repository.save(taskRun);

      // start the task
      niceCommander.startTask(taskName);

      return taskRun;
    }

    @Query(returns => TaskRun)
    async taskRun(@Arg("id", type => String) id: string) {
      const task = this.repository.findOne({ where: { id } });
      return task;
    }
  }

  return TasksRunResolver;
}
