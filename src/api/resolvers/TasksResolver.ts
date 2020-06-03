import { Resolver, Query, Arg, Int } from "type-graphql";
import { Connection } from "typeorm";
import { Service, Inject } from "typedi";

import { Task } from "../models/Task";
import { assertNumberArgumentIsInRange } from "./util";

@Service()
@Resolver(Task)
export default class TasksResolver {
  constructor(@Inject("connection") private readonly connection: Connection) {}
  private get repository() {
    const taskRepository = this.connection.getRepository(Task);
    return taskRepository;
  }

  @Query((returns) => [Task], { description: "Get a list of tasks" })
  async tasks(
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

    const tasks = await this.repository.find({
      take,
      skip,
      relations: ["runs"],
    });

    return tasks.map((task) => ({
      ...task,
      runs: task.runs.sort((a, b) => b.startTime - a.startTime),
    }));
  }

  @Query((returns) => Task, {
    description: "Get a single task",
    nullable: true,
  })
  async task(@Arg("name", { description: "Task unique name" }) name: string) {
    const task = await this.repository.findOne({
      where: { name },
      relations: ["runs"],
    });

    // Avoid joint if not necessary
    if (task && !task.runs.length) {
      return task;
    }

    return this.repository
      .createQueryBuilder("task")
      .where({ name })
      .innerJoinAndSelect("task.runs", "runs")
      .orderBy("runs.startTime", "DESC")
      .getOne();
  }
}
