import { ObjectType, ID, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  Double
} from "typeorm";
import { Task } from "./Task";

@Entity()
@ObjectType()
export class TaskRun {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id!: string;

  @Field(type => Number, { description: "Start time" })
  @Column({ type: "bigint" })
  startTime!: number;

  @Field(type => String, { description: "Logs" })
  @Column({ default: "" })
  logs!: string;

  @Field(type => String, { description: "Payload" })
  @Column({ default: "{}" })
  payload!: string;

  @Field(type => Task, {
    description: "Task associated with this run"
  })
  @ManyToOne(
    type => Task,
    task => task.runs
  )
  task!: Task;

  @Field(type => String, {
    description: "State of the task run"
  })
  @Column()
  state!: string;

  /** A unique ID for this run and its related task */
  get uniqueId() {
    return `${this.task.id}-${this.id}`;
  }
}
