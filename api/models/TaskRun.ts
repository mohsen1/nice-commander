import { ObjectType, ID, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne
} from "typeorm";
import { Task } from "./Task";

@Entity()
@ObjectType()
export class TaskRun {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id!: string;

  @Field(type => Number, { description: "Start time" })
  @Column()
  startTime!: number;

  @Field(type => String, { description: "Logs" })
  @Column()
  logs!: string;

  @Field(type => Task, {
    description: "Task associated with this run"
  })
  @ManyToOne(
    type => Task,
    task => task.runs
  )
  task!: Task;
}
