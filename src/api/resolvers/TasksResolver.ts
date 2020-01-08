import { Resolver, Query, Arg, Int } from "type-graphql";
import { Connection } from "typeorm";

import { Task } from "../models/Task";
import { assertNumberArgumentIsInRange } from "./util";

export function getTasksResolver(connection: Connection) {
  @Resolver(Task)
  class TasksResolver {
    private get repository() {
      const taskRepository = connection.getRepository(Task);
      return taskRepository;
    }

    @Query(returns => [Task], { description: "Get a list of tasks" })
    async tasks(
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

      return this.repository.find({ take, skip, relations: ["runs"] });
    }

    @Query(returns => Task, { description: "Get a single task" })
    async task(@Arg("id") id: string) {
      return this.repository.findOne({ where: { id }, relations: ["runs"] });
    }
  }

  return TasksResolver;
}