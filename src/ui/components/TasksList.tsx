import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { Card, Elevation } from "@blueprintjs/core";

import TaskListItem from "../components/TaskListItem";
import ErrorPresenter from "../components/ErrorPresentor";
import { H4 } from "./headings";

const query = gql`
  query GetTasks {
    tasks {
      name
      id
      runs {
        state
        startTime
        endTime
      }
    }
  }
`;

const TaskList = () => {
  const { data, error } = useQuery(query);

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <Card elevation={Elevation.ONE}>
      <H4>Tasks</H4>
      {data?.tasks.map(
        (task: {
          name: string;
          id: string;
          runs: {
            state: string;
            startTime: number;
            endTime: number;
          }[];
        }) => (
          <TaskListItem
            key={task.name}
            id={task.id}
            name={task.name}
            runs={task.runs}
          />
        )
      )}
    </Card>
  );
};

export default TaskList;
