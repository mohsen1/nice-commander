import { ObjectType, ID, Field, registerEnumType, Int } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

import { Task } from "./Task";

/** How a task is invoked */
export enum InvocationSource {
  /** Manually using the dashboard */
  MANUAL,
  /** Using a schedule */
  SCHEDULED,
  /** Programmatically started */
  API,
}

export enum TaskRunState {
  RUNNING,
  FINISHED,
  ERROR,
  TIMED_OUT,
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
  })
  @Column({
    enum: TaskRunState,
    type: "enum",
  })
  public state!: TaskRunState;

  @Field((type) => InvocationSource, {
    description: "Invocation Type",
  })
  @Column({
    enum: InvocationSource,
    type: "enum",
  })
  public invocationSource!: InvocationSource;

  /** A unique ID for this run and its related task */
  public get uniqueId() {
    return `${this.task.id}-${this.id}`;
  }

  public get redisLockKey() {
    return `NiceCommander:lock:taskRun:${this.id}`;
  }
}
