import React, { useContext } from "react";
import { styled } from "linaria/react";
import Link from "next/link";
import { Card, Elevation } from "@blueprintjs/core";

import { AppContext } from "../context/AppContext";

const ItemRow = styled(Card)`
  border: 1px solid var(--color-accent-bold);
  color: var(--color-text);
  background-color: var(--color-accent-dim);
  margin: 1rem 0;
  padding: 0.5rem;
  display: block;
  cursor: pointer;
`;

interface Task {
  name: string;
  runs: { state: string; startTime: number; endTime: number | null }[];
}

const TaskListItem: React.FC<Task> = ({ name }) => {
  const appContext = useContext(AppContext);
  return (
    <Link prefetch={false} href={`${appContext?.baseUrl}/tasks/${name}`}>
      <ItemRow elevation={Elevation.ZERO} interactive>
        {name}
      </ItemRow>
    </Link>
  );
};

export default TaskListItem;
