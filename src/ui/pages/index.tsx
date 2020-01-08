import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import MainLayout from "../layouts/MainLayout";
import TaskListItem from "../components/TaskListItem";

const Index = () => {
  const query = gql`
    query getTasks {
      tasks {
        name
      }
    }
  `;
  const { data } = useQuery(query);

  return (
    <MainLayout>
      <h1>Tasks:</h1>
      {data &&
        data.tasks.map((task: any) => (
          <TaskListItem key={task.name} name={task.name} />
        ))}
    </MainLayout>
  );
};

export default Index;
