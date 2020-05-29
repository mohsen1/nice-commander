import { styled } from "linaria/react";
import {
  getBackgroundColorForStatus,
  getForegroundColorForStatus,
} from "../utils/colors";

interface BuildTimeAndStatusProps {
  /** Time spent for the build in milliseconds */
  time: number;

  /** Build status */
  status: "ERROR" | "FINISHED" | "RUNNING";
}

export default styled.span<BuildTimeAndStatusProps>`
  color: ${({ status }) => getForegroundColorForStatus(status)};
  border: 1px solid ${({ status }) => getForegroundColorForStatus(status)};
  background-color: ${({ status }) => getBackgroundColorForStatus(status)};
  border-radius: 3px;
`;
