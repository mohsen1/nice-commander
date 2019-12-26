import { Resolver, Query, Mutation, Arg } from "type-graphql";

import { Task } from "../models/Task";
import { getConnection } from "typeorm";
import { DB_CONNECTION_NAME } from '../..';

@Resolver(Task)
export class TasksResolver {
  private get repository() {
    const connection = getConnection(DB_CONNECTION_NAME);
    const taskRepository = connection.getRepository(Task);
    return taskRepository;
  }

  @Query(returns => [Task])
  async tasks() {
    return this.repository.find({});
  }

  /** Get a single task */
  @Query(returns => Task)
  async task(@Arg("id") id: string) {
    return this.repository.findOne({ id })
  }

  @Mutation(returns => Task)
  async createTask(@Arg("name") name: string) {
    const task = new Task();
    task.name = name;

    return this.repository.save(task);
  }
}
