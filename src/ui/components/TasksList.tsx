import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { Card, Elevation } from "@blueprintjs/core";

import TaskListItem from "../components/TaskListItem";
import ErrorPresenter from "../components/ErrorPresentor";
import { H4 } from "./headings";

const TaskList = () => {
  const query = gql`
    query GetTasks {
      tasks {
        name
        runs {
          state
          startTime
          endTime
        }
      }
    }
  `;
  const { data, error } = useQuery(query);

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <Card elevation={Elevation.ONE}>
      <H4>Tasks</H4>
      {data?.tasks.map((task: any) => (
        <TaskListItem key={task.name} name={task.name} runs={task.runs} />
      ))}
    </Card>
  );
};

export default TaskList;
