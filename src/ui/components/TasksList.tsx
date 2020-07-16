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
      schedule
      runs {
        state
        startTime
        endTime
      }
    }
  }
`;

interface GetTasks {
  tasks: {
    name: string;
    id: string;
    schedule: string;
    runs: {
      state: string;
      startTime: number;
      endTime: number;
    }[];
  }[];
}

const TaskList = () => {
  const { data, error } = useQuery<GetTasks>(query);

  const scheduledTasks =
    data?.tasks?.filter((task) => task.schedule !== "manual") ?? [];
  const manualTasks =
    data?.tasks?.filter((task) => task.schedule === "manual") ?? [];

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <Card elevation={Elevation.ONE}>
      {scheduledTasks.length && <H4>Scheduled Tasks</H4>}

      {scheduledTasks.map((task) => (
        <TaskListItem
          key={task.id}
          id={task.id}
          name={task.name}
          runs={task.runs}
          schedule={task.schedule}
        />
      ))}
      {manualTasks.length && <H4>Manaul Tasks</H4>}
      {manualTasks.map((task) => (
        <TaskListItem
          key={task.id}
          id={task.id}
          name={task.name}
          runs={task.runs}
        />
      ))}
    </Card>
  );
};

export default TaskList;
