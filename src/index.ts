import { NiceCommander, createMiddleware } from "./api/core";
import { TaskDefinition } from "./api/core/TaskDefinition";

import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export { TaskDefinition };
module.exports = { NiceCommander, createMiddleware };
