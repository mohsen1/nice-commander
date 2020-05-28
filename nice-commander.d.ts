declare module "nice-commander" {
  import { Handler } from "express";
  import { Options } from "./src/api/core/Options";

  function createMiddleware(options?: Options): Handler;
}
