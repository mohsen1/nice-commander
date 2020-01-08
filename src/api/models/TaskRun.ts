import { ObjectType, ID, Field } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

import { Task } from "./Task";

@Entity()
@ObjectType()
export class TaskRun {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  public id!: string;

  @Field(type => Number, { description: "Start time" })
  @Column({ type: "bigint" })
  public startTime!: number;

  @Field(type => String, { description: "Logs" })
  @Column({ default: "" })
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

  /** A unique ID for this run and its related task */
  public get uniqueId() {
    return `${this.task.id}-${this.id}`;
  }
}
