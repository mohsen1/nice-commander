import React from "react";
import { useRouter } from "next/router";

import MainLayout from "../../layouts/MainLayout";
import H1 from "../../components/titles/H1";
import H2 from "../../components/titles/H2";
import TaskRunRow from "../../components/TaskRunRow";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";

import ErrorPresenter from "../../components/ErrorPresentor";
import { withApollo } from "../../lib/apollo";
import RunTaskButton from "../../components/RunTaskButton";

interface TaskPageProps {
  taskName: string;
}

const TaskPage: React.FC<TaskPageProps> = () => {
  const router = useRouter();
  const { taskName } = router.query;
  const query = gql`
    query GetTask {
      task(name: "${taskName}") {
        name
        id
        schedule
        runs {
          state
          startTime
          endTime
          payload
        }
      }
    }
  `;
  const { data, error } = useQuery(query);

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <MainLayout>
      <H1>{data?.task?.name}</H1>
      <span>Schedule: {data?.task?.schedule}</span>
      <div>
        <RunTaskButton taskId={data?.task?.id} />
      </div>
      <H2>Runs</H2>
      {data?.task?.runs.map(run => (
        <TaskRunRow key={run.startTime} {...run} />
      ))}
    </MainLayout>
  );
};

export default withApollo(TaskPage);
