import { ObjectType, ID, Field, registerEnumType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

import { Task } from "./Task";

export enum InvocationType {
  MANUAL,
  SCHEDULED
}

registerEnumType(InvocationType, {
  name: "InvocationType",
  description: "Task Run invocation type"
});

@Entity()
@ObjectType()
export class TaskRun {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  public id!: string;

  @Field(type => Number, { description: "Start time" })
  @Column({ type: "bigint" })
  public startTime!: number;

  @Field(type => Number, {
    description: "End time",
    nullable: true,
    defaultValue: null
  })
  @Column({ type: "bigint", nullable: true })
  public endTime!: string;

  @Column({ default: "" })
  public logsPath!: string;

  @Field(type => String, { description: "Logs" })
  public logs!: string;

  @Field(type => String, { description: "Payload" })
  @Column({ default: "{}" })
  public payload!: string;

  @Field(type => Task, {
    description: "Task associated with this run"
  })
  @ManyToOne(
    type => Task,
    task => task.runs
  )
  public task!: Task;

  @Field(type => String, {
    description: "State of the task run"
  })
  @Column()
  public state!: string;

  @Field(type => InvocationType, {
    description: "Invocation Type"
  })
  @Column({
    enum: InvocationType,
    type: "enum"
  })
  public invocationType!: InvocationType;

  /** A unique ID for this run and its related task */
  public get uniqueId() {
    return `${this.task.id}-${this.id}`;
  }

  public get redisLockKey() {
    return `NiceCommander:lock:taskRun:${this.uniqueId}`;
  }
}
