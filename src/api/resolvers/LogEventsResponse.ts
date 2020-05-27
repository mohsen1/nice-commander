import { ObjectType, Field } from "type-graphql";

@ObjectType()
class OutputLogEvent {
  @Field((type) => Number, { nullable: false })
  timestamp!: number;

  @Field((type) => Number, { nullable: false })
  ingestionTime!: number;

  @Field((type) => String, { nullable: false })
  message!: string;
}

@ObjectType()
export default class LogEventsResponse {
  @Field((type) => String, { nullable: true })
  nextForwardToken?: string;

  @Field((type) => String, { nullable: true })
  nextBackwardToken?: string;

  @Field((type) => [OutputLogEvent], { nullable: false })
  events!: OutputLogEvent[];
}
