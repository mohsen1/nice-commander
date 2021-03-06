import {
  Resolver,
  Query,
  Arg,
  Int,
  Mutation,
  Ctx,
  FieldResolver,
  Root,
} from "type-graphql";
import { Connection } from "typeorm-plus";
import { Service, Inject } from "typedi";
import os from "os";

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

  @FieldResolver((type) => String)
  uniqueId(@Root() taskRun: TaskRun) {
    return taskRun.getUniqueId(
      this.niceCommander.NODE_ENV,
      String(this.niceCommander.options.sqlConnectionOptions.database)
    );
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

    const viewer = await ctx?.viewer;
    const taskRun = new TaskRun();
    taskRun.task = task;
    taskRun.startTime = Date.now();
    taskRun.invocationSource = TaskRun.InvocationSource.MANUAL;
    taskRun.state = TaskRun.TaskRunState.RUNNING;
    taskRun.payload = payload;
    taskRun.runnerEmail = viewer?.email;
    taskRun.runnerName = viewer?.name;
    taskRun.hostname = os.hostname();
    taskRun.freemem = os.freemem();
    taskRun.loadavg = os.loadavg().join(", ");

    // Store initial states of the task run
    await this.repository.save(taskRun);

    // start the task
    this.niceCommander.startTask(taskRun);

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
    return this.repository.findOneOrFail({
      where: { id },
      relations: ["task"],
    });
  }

  @Query((returns) => LogEventsResponse)
  async taskRunLogs(
    @Arg("id", (type) => String, { description: "TaskRun ID" }) id: string,
    @Arg("nextToken", (type) => String, {
      description: "Next token",
      nullable: true,
    })
    nextToken: string,

    @Arg("limit", (type) => Int, {
      description: "How many lines to get. Defaults to maximum (10k lines)",
      nullable: true,
      defaultValue: 10_000,
    })
    limit: number
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

    try {
      const logsResponse = await cloudWatchLogs
        .getLogEvents({
          logGroupName: this.niceCommander.options
            .awsCloudWatchLogsLogGroupName,
          logStreamName: taskRun.getUniqueId(
            this.niceCommander.NODE_ENV,
            String(this.niceCommander.options.sqlConnectionOptions.database)
          ),
          limit,
          startFromHead: !nextToken,
          nextToken,
        })
        .promise();

      const logEventSerializer = this.niceCommander.getTaskLogEventSerializer(
        taskRun.task.name
      );

      return {
        ...logsResponse,
        events: logsResponse.events?.map((event) => ({
          ...event,
          message: logEventSerializer(event),
        })),
      };
    } catch (err) {
      if (err?.stack?.startsWith("ResourceNotFoundException")) {
        return {
          events: [],
        };
      }

      throw err;
    }
  }

  @Mutation((returns) => Boolean)
  async stopTaskRun(
    @Arg("id", (type) => String, { description: "TaskRun ID" }) id: string
  ) {
    return this.niceCommander.stopTaskRunById(id);
  }
}
