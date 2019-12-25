import { Resolver, Query } from "type-graphql";

import { Task } from "../models/Task";

@Resolver(Task)
export class TasksResolver {
  @Query(returns => [Task])
  async tasks() {
    return [];
  }
}
