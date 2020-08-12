import { Resolver, Query, Arg, Int, FieldResolver, Root } from "type-graphql";
import { Connection } from "typeorm-plus";
import { Service, Inject } from "typedi";

import { Task } from "../models/Task";
import { assertNumberArgumentIsInRange } from "./util";
import { TaskRun } from "../models/TaskRun";

@Service()
@Resolver(Task)
export default class TasksResolver {
  constructor(@Inject("connection") private readonly connection: Connection) {}
  private get taskRepository() {
    return this.connection.getRepository(Task);
  }
  private get taskRunRepository() {
    return this.connection.getRepository(TaskRun);
  }

  @Query((returns) => [Task], { description: "Get a list of tasks" })
  tasks(
    @Arg("take", (type) => Int, {
      defaultValue: 1_000,
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
    assertNumberArgumentIsInRange("take", take, 1, 5000);
    assertNumberArgumentIsInRange("skip", skip, 0, Infinity);

    return this.taskRepository.find({ take, skip });
  }

  @Query((returns) => Task, {
    description: "Get a single task",
    nullable: true,
  })
  task(@Arg("name", { description: "Task unique name" }) name: string) {
    return this.taskRepository.findOneOrFail({ where: { name } });
  }

  @FieldResolver()
  runs(
    @Root() task: Task,

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
    skip: number,

    @Arg("order", (type) => String, {
      defaultValue: "DESC",
      nullable: true,
      description: "Sorting order based on startTime. ASC or DESC",
    })
    startTimeOrder: "ASC" | "DESC"
  ) {
    assertNumberArgumentIsInRange("take", take, 1, 11);
    assertNumberArgumentIsInRange("skip", skip, 0, Infinity);

    return this.taskRunRepository.find({
      where: { task },
      take,
      skip,
      order: { startTime: startTimeOrder },
    });
  }
}
