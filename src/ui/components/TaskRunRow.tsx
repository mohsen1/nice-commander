import styled from "styled-components";
import { getForegroundColorForStatus } from "./utils/colors";
import { displayTaskRunDuration } from "./utils/time";

const Container = styled.div<{ state: "FINISHED" | "ERROR" | "RUNNING" }>`
  padding: 1rem;
  border: 1px solid
    ${({ theme, state }) => getForegroundColorForStatus(state, theme)};
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
`;

interface TaskRun {
  state: string;
  startTime: number;
  endTime: number | null;
  payload: string;
}

const TaskRunRow: React.FC<TaskRun> = ({ state, startTime, endTime }) => (
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
);

export default TaskRunRow;
