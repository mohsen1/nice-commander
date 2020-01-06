import { Resolver, Query, Arg, Int, Mutation } from "type-graphql";
import { Connection } from "typeorm";

import { TaskRun } from "../models/TaskRun";
import { Task } from "../models/Task";
import NiceCommander, { TaskDefinition } from "../core";
import { assertNumberArgumentIsInRange } from "./util";
import NotFound from "./errors/NotFound";

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
    async runTask(
      @Arg("id", type => String, {
        description: "Task ID"
      })
      id: string,
      @Arg("payload", type => String, {
        description:
          "Task payload. This value must be a valid JSON string. Should not be bigger than 1kB",
        defaultValue: "{}"
      })
      payload: string
    ) {
      if (payload.length > 1024) {
        throw new RangeError("Payload is too big");
      }

      const [task] = (await this.taskRepository.find({ where: { id } })) || [];

      if (!task) {
        throw new Error(`Task with ID ${id} was not found`);
      }

      const taskRun = new TaskRun();
      taskRun.task = task;
      taskRun.startTime = Date.now();
      taskRun.state = "RUNNING";
      taskRun.payload = payload;

      // start the task
      await niceCommander.startTask(taskRun);

      // Save to DB
      await this.repository.save(taskRun);

      return taskRun;
    }

    @Query(returns => [TaskRun])
    async taskRuns(
      @Arg("taskId", type => String, {
        description: "Task ID to get TaskRuns for",
        nullable: false
      })
      taskId: string,
      @Arg("take", type => Int, {
        defaultValue: 10,
        nullable: true,
        description: "How many to take"
      })
      take: number,
      @Arg("skip", type => Int, {
        defaultValue: 0,
        nullable: true,
        description: "How many to skip"
      })
      skip: number
    ) {
      assertNumberArgumentIsInRange("take", take, 1, 500);
      assertNumberArgumentIsInRange("skip", skip, 0, Infinity);
      const task = await this.taskRepository.findOne({ where: { id: taskId } });

      if (!task) {
        throw new NotFound(`Task with id ${taskId} was not found.`);
      }

      const taskRuns = await this.repository.find({
        take,
        skip,
        where: { task: { id: taskId } },
        relations: ["task"]
      });

      return taskRuns;
    }

    @Query(returns => TaskRun)
    async taskRun(@Arg("id", type => String) id: string) {
      const task = this.repository.findOne({
        where: { id },
        relations: ["task"]
      });
      return task;
    }
  }

  return TasksRunResolver;
}
