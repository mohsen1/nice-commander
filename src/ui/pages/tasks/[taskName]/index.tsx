import React from "react";
import { useRouter } from "next/router";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";
import { cx } from "linaria";

import MainLayout from "../../../layouts/MainLayout";
import Editor from "../../../components/Editor";
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
      <h1 className={cx("bp3-heading")}>{data?.task?.name}</h1>
      <p>
        {data?.task?.schedule === "manual"
          ? "Manual invocation only"
          : `Runs every ${data?.task?.schedule}`}
      </p>
      <p>Times out after {data?.task?.timeoutAfterDescription}</p>
      <h2 className={cx("bp3-heading")}>Code</h2>
      <Editor readonly value={data?.task?.code} language="typescript" />

      <div>
        <RunTaskPanel taskId={data?.task?.id} />
      </div>
      <h2 className={cx("bp3-heading")}>Latest Runs</h2>
      {data?.task?.runs?.map((run) => (
        <TaskRunRow key={run.startTime} taskName={data?.task?.name} {...run} />
      ))}
    </MainLayout>
  );
};

export default withApollo(TaskPage);
