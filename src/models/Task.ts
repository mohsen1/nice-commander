import { ObjectType, ID, Field } from "type-graphql";

@ObjectType()
export class Task {
  @Field(type => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(type => Number)
  startTime!: number;
}
