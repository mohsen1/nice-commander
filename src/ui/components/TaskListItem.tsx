import React from "react";
import styled from "styled-components";

const ItemRow = styled.div`
  border: 1px solid ${props => props.theme.colors.accent.light};
  margin: 1rem 0;
  padding: 0.5rem;
`;

interface Task {
  name: string;
}

const TaskListItem: React.FC<Task> = ({ name }) => <ItemRow>{name}</ItemRow>;

export default TaskListItem;
