import { Resolver, Query, Arg, Int, Mutation, Ctx } from "type-graphql";

import { TaskRun } from "../models/TaskRun";
import { NiceCommander, NiceCommanderContext } from "../../api/core";
import { prisma } from "../..";
import { assertNumberArgumentIsInRange } from "./util";
import NotFound from "./errors/NotFound";
import LogEventsResponse from "./LogEventsResponse";

export function getTasksRunResolver(niceCommander: NiceCommander) {
  @Resolver(TaskRun)
  class TasksRunResolver {
    @Mutation((returns) => TaskRun)
    async runTask(
      @Arg("id", (type) => String, {
        description: "Task ID",
      })
      id: string,
      @Arg("payload", (type) => String, {
        description:
          "Task payload. This value must be a valid JSON string. Should not be bigger than 1kB",
        defaultValue: "{}",
      })
      payload: string,
      @Ctx() ctx: NiceCommanderContext
    ) {
      if (payload.length > 1024) {
        throw new RangeError("Payload is too big");
      }

      const task = await prisma.task.findOne({
        where: { id: parseInt(id, 10) },
      });

      if (!task) {
        throw new Error(`Task with ID ${id} was not found`);
      }

      const taskRun = await prisma.taskRun.create({
        data: {
          startTime: Date.now(),
          invocationSource: TaskRun.InvocationSource.MANUAL,
          state: TaskRun.TaskRunState.RUNNING,
          payload: payload,
          runnerEmail: ctx?.viewer?.email,
          runnerName: ctx?.viewer?.name,
          task: {
            connect: {
              id: task.id,
            },
          },
        },
      });

      // start the task
      await niceCommander.startTask(taskRun);

      // Save to DB
      // await taskRun.

      return taskRun;
    }

    @Query((returns) => [TaskRun])
    async taskRuns(
      @Arg("taskId", (type) => String, {
        description: "Task ID to get TaskRuns for",
        nullable: false,
      })
      taskId: string,
      @Arg("take", (type) => Int, {
        defaultValue: 10,
        nullable: true,
        description: "How many to take",
      })
      take: number,
      @Arg("skip", (type) => Int, {
        defaultValue: 0,
        nullable: true,
        description: "How many to skip",
      })
      skip: number
    ) {
      assertNumberArgumentIsInRange("take", take, 1, 500);
      assertNumberArgumentIsInRange("skip", skip, 0, Infinity);
      const task = await prisma.task.findOne({
        where: { id: parseInt(taskId, 10) },
      });

      if (!task) {
        throw new NotFound(`Task with id ${taskId} was not found.`);
      }

      const taskRuns = await prisma.taskRun.findMany({
        take,
        skip,
        where: { task: { id: taskId } },
        relations: ["task"],
        order: { startTime: "DESC" },
      });

      return taskRuns;
    }

    @Query((returns) => TaskRun)
    async taskRun(@Arg("id", (type) => String) id: string) {
      const taskRun = await prisma.taskRun.findOne({
        where: { id: parseInt(id, 10) },
        include: {
          task: true,
        },
      });

      if (!taskRun) {
        throw new NotFound(`TaskRun with id ${id} was not found`);
      }

      return taskRun;
    }

    @Query((returns) => LogEventsResponse)
    async taskRunLogs(
      @Arg("id", (type) => String, { description: "TaskRun ID" }) id: string,
      @Arg("nextToken", (type) => String, {
        description: "Next token",
        nullable: true,
      })
      nextToken: string
    ) {
      const taskRun = await prisma.taskRun.findOne({
        where: { id: parseInt(id, 10) },
        include: {
          task: true,
        },
      });

      if (!taskRun) {
        throw new NotFound(`TaskRun with id ${id} was not found`);
      }

      return niceCommander.cloudWatchLogs
        .getLogEvents({
          logGroupName: niceCommander.logGroupName,
          logStreamName: taskRun.uniqueId,
          startFromHead: !nextToken,
          nextToken,
        })
        .promise();
    }
  }

  return TasksRunResolver;
}
