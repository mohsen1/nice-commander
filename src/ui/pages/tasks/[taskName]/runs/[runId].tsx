import React, { useContext } from "react";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useQuery } from "react-apollo";
import { styled } from "linaria/react";
import Link from "next/link";
import { cx } from "linaria";

import Editor from "../../../../components/Editor";
import MainLayout from "../../../../layouts/MainLayout";
import ErrorPresenter from "../../../../components/ErrorPresentor";
import { withApollo } from "../../../../lib/apollo";
import { displayTaskRunDuration } from "../../../../components/utils/time";
import { AppContext } from "../../../../context/AppContext";
import LogViewer from "../../../../components/LogViewer";

const DetailsRow = styled.p`
  padding: 0.5rem 0;
`;

const TaskRunPage: React.FC = () => {
  const { taskName, runId } = useRouter().query;

  const query = gql`
    query GetTaskRun {
      taskRun(id: "${runId}") {
          endTime
          startTime
          state
          payload
          id
          invocationSource
          runnerName
          runnerEmail
          task {
            name
            id
          }
      }
    }`;

  const { data, error, stopPolling } = useQuery(query, {
    pollInterval: 1000,
    notifyOnNetworkStatusChange: true,
  });

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  if (data?.taskRun?.state && data?.taskRun?.state !== "RUNNING") {
    stopPolling();
  }

  const appContext = useContext(AppContext);

  return (
    <MainLayout>
      <h1 className={cx("bp3-heading")}>
        <Link
          prefetch={false}
          href={`${appContext?.baseUrl}/tasks/${taskName}`}
        >
          <a>{taskName}</a>
        </Link>
      </h1>
      <DetailsRow>
        Started by:{" "}
        <a href={`mailto://${data?.taskRun.runnerEmail}`}>
          {data?.taskRun.runnerName}{" "}
        </a>
      </DetailsRow>
      <DetailsRow>
        Status: <span>{data?.taskRun.state}</span>
      </DetailsRow>
      <DetailsRow>
        Runtime:{" "}
        {displayTaskRunDuration(data?.taskRun.startTime, data?.taskRun.endTime)}
      </DetailsRow>
      <DetailsRow>
        Invocation source: {data?.taskRun.invocationSource}
      </DetailsRow>
      <DetailsRow>
        Started at {new Date(data?.taskRun.startTime).toLocaleString()}
      </DetailsRow>
      <h2 className={cx("bp3-heading")}>Payload</h2>
      <Editor readonly maxHeight={10} value={data?.taskRun.payload} />
      <h2 className={cx("bp3-heading")}>Logs</h2>
      <LogViewer
        taskRunId={runId as string}
        isRunning={data?.taskRun.state === "RUNNING"}
      />
    </MainLayout>
  );
};

export default withApollo(TaskRunPage);
