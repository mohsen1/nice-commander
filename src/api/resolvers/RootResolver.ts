import { Field, Ctx, Query, ObjectType } from "type-graphql";

import { NiceCommanderContext } from "../core";

@ObjectType()
class Viewer {
  @Field({ description: "viewer name", nullable: true })
  name?: string;

  @Field({ description: "viewer email", nullable: true })
  email?: string;
}

class RootResolver {
  @Query((returns) => Viewer, {
    description: "Get current viewer",
    nullable: true,
  })
  async viewer(@Ctx() context: NiceCommanderContext) {
    return context?.viewer;
  }
}

export default RootResolver;
