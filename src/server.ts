import express from "express";

import { getExpressMiddleware } from ".";

async function main() {
  const app = express();

  app.get("/foo", (req, res) => res.status(200).send("OK"));

  const middleware = await getExpressMiddleware();
  app.use("/nice-commander", middleware);

  app.listen(3000);
}

main().catch(console.error);
