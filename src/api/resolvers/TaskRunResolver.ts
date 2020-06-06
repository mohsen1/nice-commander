import { Resolver, Query, Arg, Int, Mutation, Ctx } from "type-graphql";
import { Connection } from "typeorm-plus";
import { Service, Inject } from "typedi";

import { TaskRun } from "../models/TaskRun";
import { Task } from "../models/Task";
import { NiceCommander, NiceCommanderContext } from "../../api/core";
import { assertNumberArgumentIsInRange } from "./util";
import NotFound from "./errors/NotFound";
import LogEventsResponse from "./LogEventsResponse";
import { CloudWatchLogs } from "aws-sdk";

@Service()
@Resolver(TaskRun)
export default class TasksRunResolver {
  constructor(
    @Inject("connection")
    private connection: Connection,

    @Inject("niceCommander")
    private niceCommander: NiceCommander
  ) {}

  private get repository() {
    const taskRunRepository = this.connection.getRepository(TaskRun);
    return taskRunRepository;
  }

  private get taskRepository() {
    const taskRepository = this.connection.getRepository(Task);
    return taskRepository;
  }

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

    const [task] = (await this.taskRepository.find({ where: { id } })) || [];

    if (!task) {
      throw new Error(`Task with ID ${id} was not found`);
    }

    const taskRun = new TaskRun();
    taskRun.task = task;
    taskRun.startTime = Date.now();
    taskRun.invocationSource = TaskRun.InvocationSource.MANUAL;
    taskRun.state = TaskRun.TaskRunState.RUNNING;
    taskRun.payload = payload;
    taskRun.runnerEmail = ctx?.viewer?.email;
    taskRun.runnerName = ctx?.viewer?.name;

    // Store initial states of the task run
    await this.repository.save(taskRun);

    // start the task
    await this.niceCommander.startTask(taskRun);

    // Save to DB
    await this.repository.save(taskRun);

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
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFound(`Task with id ${taskId} was not found.`);
    }

    const taskRuns = await this.repository.find({
      take,
      skip,
      where: { task: { id: taskId } },
      relations: ["task"],
      order: { startTime: "DESC" },
    });

    return taskRuns.sort((a, b) => a.startTime - b.startTime);
  }

  @Query((returns) => TaskRun)
  async taskRun(@Arg("id", (type) => String) id: string) {
    const taskRun = await this.repository.findOne({
      where: { id },
      relations: ["task"],
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
    const taskRun = await this.repository.findOne({
      where: { id },
      relations: ["task"],
    });

    if (!taskRun) {
      throw new NotFound(`TaskRun with id ${id} was not found`);
    }

    const cloudWatchLogs = new CloudWatchLogs({
      region: this.niceCommander.options.awsRegion,
      credentials: this.niceCommander.options.awsCredentials,
    });

    return cloudWatchLogs
      .getLogEvents({
        logGroupName:
          this.niceCommander.options.awsCloudWatchLogsLogGroupName ??
          "NiceCommander",
        logStreamName: taskRun.getUniqueId(
          this.niceCommander.NODE_ENV,
          String(this.niceCommander.options.sqlConnectionOptions.database)
        ),
        startFromHead: !nextToken,
        nextToken,
      })
      .promise();
  }

  @Mutation((returns) => Boolean)
  async stopTaskRun(
    @Arg("id", (type) => String, { description: "TaskRun ID" }) id: string
  ) {
    return this.niceCommander.stopTaskRunById(id);
  }
}
