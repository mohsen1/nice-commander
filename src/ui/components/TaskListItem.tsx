import React, { useContext } from "react";
import { styled } from "linaria/react";
import Link from "next/link";

import { AppContext } from "../context/AppContext";

const ItemRow = styled.a`
  border: 1px solid var(--color-accent-dim);
  color: var(--color-text);
  background-color: var(--color-accent-normal);
  margin: 1rem 0;
  padding: 0.5rem;
  display: block;
  hover: {
    text-decoration: none;
  }
`;

interface Task {
  name: string;
  runs: { state: string; startTime: number; endTime: number | null }[];
}

const TaskListItem: React.FC<Task> = ({ name }) => {
  const appContext = useContext(AppContext);
  return (
    <Link prefetch={false} href={`${appContext?.baseUrl}/tasks/${name}`}>
      <ItemRow>{name}</ItemRow>
    </Link>
  );
};

export default TaskListItem;
