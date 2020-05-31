import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { cx } from "linaria";

import TaskListItem from "../components/TaskListItem";
import ErrorPresenter from "../components/ErrorPresentor";

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
    <>
      <h1 className={cx("bp3-heading")}>Tasks</h1>
      {data?.tasks.map((task: any) => (
        <TaskListItem key={task.name} name={task.name} runs={task.runs} />
      ))}
    </>
  );
};

export default TaskList;
