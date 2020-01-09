import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";

import TaskListItem from "../components/TaskListItem";
import ErrorPresenter from "../components/ErrorPresentor";
import H1 from "./titles/H1";

const TaskList = () => {
  const query = gql`
    query GetTasks {
      tasks {
        name
      }
    }
  `;
  const { data, error } = useQuery(query);

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <>
      <H1>Tasks</H1>
      {data?.tasks.map((task: any) => (
        <TaskListItem key={task.name} name={task.name} />
      ))}
    </>
  );
};

export default TaskList;
