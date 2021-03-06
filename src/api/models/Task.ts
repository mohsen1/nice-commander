import { ObjectType, ID, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from "typeorm-plus";

import { TaskRun } from "./TaskRun";

@Entity()
@ObjectType()
export class Task {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  public id!: string;

  @DeleteDateColumn()
  public deletedAt!: Date;

  @Field({ description: "Task name (unique)" })
  @Column({ unique: true })
  public name!: string;

  @Field({ description: "Task description" })
  @Column()
  public description!: string;

  @Field({ description: "Task file code content" })
  @Column({ type: "text" })
  public code!: string;

  @Field((type) => Number, { description: "timeout after (ms)" })
  @Column()
  public timeoutAfter!: number;

  @Field((type) => String, {
    description: "timeout after as described in task definition.",
  })
  @Column()
  public timeoutAfterDescription!: string;

  @Field((type) => String, {
    description: "Unhandled Promise Rejections behavior",
    nullable: true,
  })
  @Column({ nullable: true })
  public unhandledRejections?: string;

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
