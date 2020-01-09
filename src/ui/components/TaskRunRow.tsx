import styled from "styled-components";
import {
  getForegroundColorForStatus,
  getBackgroundColorForStatus
} from "./utils/colors";
import { displayTaskRunDuration } from "./utils/time";
import Link from "next/link";

const Container = styled.div<{ state: "FINISHED" | "ERROR" | "RUNNING" }>`
  padding: 1rem;
  border: 1px solid
    ${({ theme, state }) => getForegroundColorForStatus(state, theme)};
  background-color: ${({ theme, state }) =>
    getBackgroundColorForStatus(state, theme)};
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
`;

const A = styled.a`
  text-decoration: none;
  cursor: pointer;
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
  id: taskRunId
}) => (
  <Link href={`${process.env.mountPath}/tasks/${taskName}/runs/${taskRunId}`}>
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

export default TaskRunRow;
