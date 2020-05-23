import { ObjectType, ID, Field, registerEnumType, Int } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

import { Task } from "./Task";

enum InvocationType {
  MANUAL,
  SCHEDULED,
}

enum State {
  RUNNING,
  FINISHED,
  ERROR,
  TIMED_OUT,
}

registerEnumType(InvocationType, {
  name: "InvocationType",
  description: "Task Run invocation type",
});
registerEnumType(State, {
  name: "State",
  description: "State TaskRun is at right now",
});

@Entity()
@ObjectType()
export class TaskRun {
  static InvocationType = InvocationType;
  static State = State;

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

  @Column({ default: "" })
  public logsPath!: string;

  @Field((type) => String, { description: "Logs" })
  public logs!: string;

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

  @Field((type) => State, {
    description: "State of the TaskRun",
  })
  @Column({
    enum: State,
    type: "enum",
  })
  public state!: State;

  @Field((type) => InvocationType, {
    description: "Invocation Type",
  })
  @Column({
    enum: InvocationType,
    type: "enum",
  })
  public invocationType!: InvocationType;

  /** A unique ID for this run and its related task */
  public get uniqueId() {
    return `${this.task.id}-${this.id}`;
  }

  public get redisLockKey() {
    return `NiceCommander:lock:taskRun:${this.id}`;
  }
}
