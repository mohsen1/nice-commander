import React, { useContext } from "react";
import { styled } from "linaria/react";
import Link from "next/link";
import { Card, Elevation } from "@blueprintjs/core";

import RunButton from "./RunButton";
import { AppContext } from "../context/AppContext";
import { displayTaskRunDuration } from "./utils/time";
import {
  getForegroundColorForStatus,
  Status,
  getBackgroundColorForStatus,
} from "./utils/colors";

const ItemRow = styled(Card)`
  border: 1px solid var(--color-accent-bold);
  color: var(--color-text);
  background-color: var(--color-accent-dim);
  margin: 1rem 0;
  padding: 0.5rem;
  display: block;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface Run {
  state: string;
  startTime: number;
  endTime: number | null;
}
interface Task {
  name: string;
  id: string;
  runs: Run[];
}

const RunDotSpan = styled.pre<{ status: Status }>`
  border-color: ${({ status }) => getForegroundColorForStatus(status)};
  background-color: ${({ status }) => getBackgroundColorForStatus(status)};
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  min-width: 26px;
  padding: 3px;
  margin: 0 3px;
  display: inline-block;
  text-align: center;
`;

const TaskTitle = styled.span`
  margin-left: 1rem;
`;

const RunDot: React.FC<{ run: Run }> = ({ run }) => {
  const duration = displayTaskRunDuration(run.startTime, run.endTime);
  return <RunDotSpan status={run.state as Status}>{duration}</RunDotSpan>;
};

const TaskListItem: React.FC<Task> = ({ name, runs, id }) => {
  const appContext = useContext(AppContext);

  return (
    <Link
      prefetch={false}
      as={`${appContext?.baseUrl}/tasks/${name}`}
      href={`${appContext?.baseUrl}/tasks/[taskName]`}
    >
      <ItemRow elevation={Elevation.ZERO} interactive>
        <span>
          <RunButton taskId={id} taskName={name} text={``} />
          <TaskTitle>{name}</TaskTitle>
        </span>
        <span>
          {runs
            .slice(0, 5)
            .reverse()
            .map((run) => (
              <RunDot run={run} key={run.startTime} />
            ))}
        </span>
      </ItemRow>
    </Link>
  );
};

export default TaskListItem;
