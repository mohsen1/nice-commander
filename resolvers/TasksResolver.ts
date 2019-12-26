import { Resolver, Query, Mutation, Arg } from "type-graphql";

import { Task } from "../models/Task";
import { getConnection } from "typeorm";

@Resolver(Task)
export class TasksResolver {
  private get repository() {
    const connection = getConnection();
    const taskRepository = connection.getRepository(Task);
    return taskRepository;
  }

  @Query(returns => [Task])
  async tasks() {
    return this.repository.find({});
  }

  @Mutation(returns => Task)
  async createTask(@Arg("name") name: string) {
    const task = new Task();
    task.name = name;

    return this.repository.save(task);
  }
}
