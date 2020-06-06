import { ObjectType, ID, Field, registerEnumType, Int } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm-plus";

import { Task } from "./Task";

/** How a task is invoked */
export enum InvocationSource {
  /** Manually using the dashboard */
  MANUAL = "MANUAL",
  /** Using a schedule */
  SCHEDULED = "SCHEDULED",
  /** Programmatically started */
  API = "API",
}

export enum TaskRunState {
  RUNNING = "RUNNING",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
  TIMED_OUT = "TIMED_OUT",
  KILLED = "KILLED",
}

registerEnumType(InvocationSource, {
  name: "InvocationSource",
  description:
    "Task Run invocation source. This indicates how this task is invoked ",
});
registerEnumType(TaskRunState, {
  name: "TaskRunState",
  description: "State TaskRun is at right now",
});

@Entity()
@ObjectType()
export class TaskRun {
  static InvocationSource = InvocationSource;
  static TaskRunState = TaskRunState;

  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  public id!: string;

  @Field((type) => Number, { description: "Start time" })
  @Column({ type: "bigint" })
  public startTime!: number;

  @Field((type) => Number, {
    description: "End time",
    nullable: true,
    defaultValue: null,
  })
  @Column({ type: "bigint", nullable: true })
  public endTime!: string;

  @Field((type) => String, { description: "Runner email", nullable: true })
  @Column({ nullable: true })
  public runnerEmail?: string;

  @Field((type) => String, { description: "Runner name", nullable: true })
  @Column({ nullable: true })
  public runnerName?: string;

  @Field((type) => String, { description: "Payload" })
  @Column({ default: "{}" })
  public payload!: string;

  @Field((type) => Int, { description: "Exit Code", nullable: true })
  @Column({ nullable: true, type: "int" })
  public exitCode!: number | null;

  @Field((type) => String, { description: "Exit Signal", nullable: true })
  @Column({ nullable: true, type: "text" })
  public exitSignal!: string | null;

  @Field((type) => Task, {
    description: "Task associated with this run",
  })
  @ManyToOne((type) => Task, (task) => task.runs)
  public task!: Task;

  @Field((type) => TaskRunState, {
    description: "State of the TaskRun",
    defaultValue: TaskRunState.RUNNING,
  })
  @Column({
    enum: TaskRunState,
    type: "enum",
    default: TaskRunState.RUNNING,
  })
  public state!: TaskRunState;

  @Field((type) => InvocationSource, {
    description: "Invocation Type",
    defaultValue: InvocationSource.MANUAL,
  })
  @Column({
    enum: InvocationSource,
    default: InvocationSource.MANUAL,
    type: "enum",
  })
  public invocationSource!: InvocationSource;

  /**
   * Get unique ID for this run and its related task
   * This unique ID is unique across various databases and environments
   * because is is used to make a unique name for this run's CloudWatch Logs log stream
   */
  public getUniqueId(nodeEnv: string, dbName: string) {
    return `${dbName}-${nodeEnv}-${this.task.id}-${this.id}`;
  }

  public get redisLockKey() {
    return `NiceCommander:lock:taskRun:${this.id}`;
  }
}
