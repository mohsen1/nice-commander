import React, { useContext } from "react";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useQuery } from "react-apollo";
import styled from "styled-components";
import Link from "next/link";

import Editor from "../../../../components/Editor";
import MainLayout from "../../../../layouts/MainLayout";
import ErrorPresenter from "../../../../components/ErrorPresentor";
import H1 from "../../../../components/titles/H1";
import { withApollo } from "../../../../lib/apollo";
import H2 from "../../../../components/titles/H2";
import A from "../../../../components/base/A";
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

  const { baseUrl } = useContext(AppContext);

  return (
    <MainLayout>
      <H1>
        <Link prefetch={false} href={`${baseUrl}/tasks/${taskName}`}>
          <A>{taskName}</A>
        </Link>
      </H1>
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
      <H2>Payload</H2>
      <Editor readonly maxHeight={10} value={data?.taskRun.payload} />
      <H2>Logs</H2>
      <LogViewer
        taskRunId={runId as string}
        isRunning={data?.taskRun.state === "RUNNING"}
      />
    </MainLayout>
  );
};

export default withApollo(TaskRunPage);
