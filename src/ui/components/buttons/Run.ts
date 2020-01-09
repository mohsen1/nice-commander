import styled from "styled-components";

import {
  getBackgroundColorForStatus,
  getForegroundColorForStatus
} from "../utils/colors";
import BaseButton from "./BaseButton";

export default styled(BaseButton)`
  border-color: ${({ theme }) =>
    getForegroundColorForStatus("FINISHED", theme)};
  color: ${({ theme }) => getForegroundColorForStatus("FINISHED", theme)};
  background-color: ${({ theme }) =>
    getBackgroundColorForStatus("FINISHED", theme)};
`;
