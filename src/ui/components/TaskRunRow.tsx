import React from "react";
import { styled } from "linaria/react";
import Link from "next/link";
import { Card, Elevation } from "@blueprintjs/core";

import {
  getForegroundColorForStatus,
  getBackgroundColorForStatus,
} from "./utils/colors";
import { displayTaskRunDuration } from "./utils/time";
import { useContext } from "react";

const Container = styled(Card)<{ state: "FINISHED" | "ERROR" | "RUNNING" }>`
  padding: 1rem;
  border: 1px solid ${({ state }) => getForegroundColorForStatus(state)};
  color: ${({ state }) => getForegroundColorForStatus(state)};
  background-color: ${({ state }) => getBackgroundColorForStatus(state)};
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
  return (
    <Link
      prefetch={false}
      as={`tasks/${taskName}/runs/${taskRunId}`}
      href={`tasks/[taskName]/runs/[runId]`}
    >
      <a>
        <Container
          elevation={Elevation.ZERO}
          interactive
          state={state as "FINISHED" | "ERROR" | "RUNNING"}
        >
          <span>
            {new Date(startTime).toLocaleDateString("en-US", {})}
            {" - "}
            {new Date(startTime).toLocaleTimeString()}
            {" · "}
            {state}
          </span>
          <span>{displayTaskRunDuration(startTime, endTime)}</span>
        </Container>
      </a>
    </Link>
  );
};

export default TaskRunRow;
