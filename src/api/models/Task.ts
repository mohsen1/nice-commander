import { ObjectType, ID, Field } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TaskRun } from "./TaskRun";

@Entity()
@ObjectType()
export class Task {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id!: string;

  @Field({ description: "Task name" })
  @Column()
  name!: string;

  @Field(type => Number, { description: "Path of the task file." })
  @Column()
  timeoutAfter!: number;

  @Field(type => [TaskRun], {
    description: "List of task runs",
    defaultValue: []
  })
  @OneToMany(
    type => TaskRun,
    taskRun => taskRun.task
  )
  runs!: TaskRun[];

  @Field(type => String)
  @Column()
  schedule!: string;
}
