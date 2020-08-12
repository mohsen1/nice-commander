/* eslint-disable @typescript-eslint/no-namespace */

import { NiceCommanderUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: NiceCommanderUser;
      /** Request unique identifier */
      uuid?: string;
    }
  }
}
