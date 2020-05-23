import styled from "styled-components";
import Link from "next/link";

import {
  getForegroundColorForStatus,
  getBackgroundColorForStatus,
} from "./utils/colors";
import { displayTaskRunDuration } from "./utils/time";
import A from "./base/A";
import { useRouter } from "next/router";
import { AppContext } from "../context/AppContext";
import { useContext } from "react";

const Container = styled.div<{ state: "FINISHED" | "ERROR" | "RUNNING" }>`
  padding: 1rem;
  border: 1px solid
    ${({ theme, state }) => getForegroundColorForStatus(state, theme)};
  color: ${({ theme, state }) => getForegroundColorForStatus(state, theme)};
  background-color: ${({ theme, state }) =>
    getBackgroundColorForStatus(state, theme)};
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
`;

interface TaskRun {
  taskName: string;
  state: string;
  startTime: number;
  endTime: number | null;
  payload: string;
  id: string;
}

const TaskRunRow: React.FC<TaskRun> = ({
  taskName,
  state,
  startTime,
  endTime,
  id: taskRunId,
}) => {
  const { baseUrl } = useContext(AppContext);
  return (
    <Link
      prefetch={false}
      href={`${baseUrl}/tasks/${taskName}/runs/${taskRunId}`}
    >
      <A>
        <Container state={state}>
          <span>
            {new Date(startTime).toLocaleDateString("en-US", {})}
            {" - "}
            {new Date(startTime).toLocaleTimeString()}
            {" · "}
            {state}
          </span>
          <span>{displayTaskRunDuration(startTime, endTime)}</span>
        </Container>
      </A>
    </Link>
  );
};

export default TaskRunRow;
