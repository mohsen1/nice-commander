import React, { useContext } from "react";
import styled from "styled-components";
import Link from "next/link";

import A from "./base/A";
import { AppContext } from "../context/AppContext";

const ItemRow = styled(A)`
  border: 1px solid ${props => props.theme.colors.accent.light};
  color: ${props => props.theme.colors.text};
  background-color: ${props => props.theme.colors.background};
  margin: 1rem 0;
  padding: 0.5rem;
  display: block;
`;

interface Task {
  name: string;
  runs: { state: string; startTime: number; endTime: number | null }[];
}

const TaskListItem: React.FC<Task> = ({ name }) => {
  const { baseUrl } = useContext(AppContext);
  return (
    <Link prefetch={false} href={`${baseUrl}/tasks/${name}`}>
      <ItemRow>{name}</ItemRow>
    </Link>
  );
};

export default TaskListItem;
