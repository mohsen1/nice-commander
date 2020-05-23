import { ObjectType, ID, Field } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

import { TaskRun } from "./TaskRun";

@Entity()
@ObjectType()
export class Task {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  public id!: string;

  @Field({ description: "Task name" })
  @Column()
  public name!: string;

  @Field({ description: "Task file code content" })
  @Column({ type: "text" })
  public code!: string;

  @Field((type) => Number, { description: "Path of the task file." })
  @Column()
  public timeoutAfter!: number;

  @Field((type) => [TaskRun], {
    description: "List of task runs",
    defaultValue: [],
  })
  @OneToMany((type) => TaskRun, (taskRun) => taskRun.task)
  public runs!: TaskRun[];

  @Field((type) => String)
  @Column()
  public schedule!: string;
}
