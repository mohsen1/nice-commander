import styled from "styled-components";
import {
  getBackgroundColorForStatus,
  getForegroundColorForStatus
} from "../utils/colors";

interface BuildTimeAndStatusProps {
  /** Time spent for the build in milliseconds */
  time: number;

  /** Build status */
  status: "ERROR" | "FINISHED" | "RUNNING";
}

export default styled.span<BuildTimeAndStatusProps>`
  color: ${({ theme, status }) => getForegroundColorForStatus(status, theme)};
  border: 1px solid
    ${({ theme, status }) => getForegroundColorForStatus(status, theme)};
  background-color: ${({ theme, status }) =>
    getBackgroundColorForStatus(status, theme)};
  border-radius: 3px;
`;
