import { styled } from "linaria/react";

import {
  getBackgroundColorForStatus,
  getForegroundColorForStatus,
} from "../utils/colors";
import BaseButton from "./BaseButton";

export default styled(BaseButton)`
  border-color: ${() => getForegroundColorForStatus("FINISHED")};
  color: ${() => getForegroundColorForStatus("FINISHED")};
  background-color: ${() => getBackgroundColorForStatus("FINISHED")};
`;
