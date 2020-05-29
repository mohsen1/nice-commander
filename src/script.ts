import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.create({
    data: {
      code: "test",
      schedule: "manual",
      name: "testing testing",
      timeoutAfter: 1000,
    },
  });

  console.log({ task });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.disconnect();
  });
