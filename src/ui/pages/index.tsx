import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";

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
    <>
      <h1>Tasks:</h1>
      {data &&
        data.tasks.map((task: any) => (
          <React.Fragment key={task.name}>Task: {task.name}</React.Fragment>
        ))}
    </>
  );
};

export default Index;
