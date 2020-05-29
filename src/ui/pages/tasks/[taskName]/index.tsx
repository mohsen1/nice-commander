import React from "react";
import { useRouter } from "next/router";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";

import MainLayout from "../../../layouts/MainLayout";
import H1 from "../../../components/titles/H1";
import Editor from "../../../components/Editor";
import H2 from "../../../components/titles/H2";
import TaskRunRow from "../../../components/TaskRunRow";
import ErrorPresenter from "../../../components/ErrorPresentor";
import { withApollo } from "../../../lib/apollo";
import RunTaskPanel from "../../../components/RunTaskPanel";

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
        code
        timeoutAfterDescription
        runs {
          id
          state
          startTime
          endTime
          payload
        }
      }
    }
  `;
  const { data, error } = useQuery(query, { pollInterval: 2000 });

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <MainLayout>
      <H1>{data?.task?.name}</H1>
      <p>
        {data?.task?.schedule === "manual"
          ? "Manual invocation only"
          : `Runs every ${data?.task?.schedule}`}
      </p>
      <p>Times out after {data?.task?.timeoutAfterDescription}</p>
      <H2>Code</H2>
      <Editor readonly value={data?.task?.code} language="typescript" />

      <div>
        <RunTaskPanel taskId={data?.task?.id} />
      </div>
      <H2>Latest Runs</H2>
      {data?.task?.runs?.map((run) => (
        <TaskRunRow key={run.startTime} taskName={data?.task?.name} {...run} />
      ))}
    </MainLayout>
  );
};

export default withApollo(TaskPage);
