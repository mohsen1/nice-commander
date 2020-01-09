import React from "react";
import styled from "styled-components";
import Link from "next/link";

const ItemRow = styled.a`
  border: 1px solid ${props => props.theme.colors.accent.light};
  margin: 1rem 0;
  padding: 0.5rem;
  display: block;
`;

interface Task {
  name: string;
  runs: { state: string; startTime: number; endTime: number | null }[];
}

const TaskListItem: React.FC<Task> = ({ name }) => (
  <Link href={`${process.env.mountPath}/tasks/${name}`}>
    <ItemRow>{name}</ItemRow>
  </Link>
);

export default TaskListItem;
