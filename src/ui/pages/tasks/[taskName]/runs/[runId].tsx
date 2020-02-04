import React from "react";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useQuery, useSubscription } from "react-apollo";
import styled from "styled-components";

import Editor from "../../../../components/Editor";
import MainLayout from "../../../../layouts/MainLayout";
import ErrorPresenter from "../../../../components/ErrorPresentor";
import H1 from "../../../../components/titles/H1";
import { withApollo } from "../../../../lib/apollo";
import H2 from "../../../../components/titles/H2";
import Link from "next/link";
import A from "../../../../components/base/A";
import { displayTaskRunDuration } from "../../../../components/utils/time";

const DetailsRow = styled.p`
  padding: 0.5rem 0;
`;

const TaskRunPage: React.FC = () => {
  const router = useRouter();
  const { taskName, runId } = router.query;
  const query = gql`
    query GetTaskRun($runId: String!) {
      taskRun(id: $runId) {
        endTime
        startTime
        state
        logs
        payload
        id
        invocationType
        exitSignal
        exitCode
        task {
          name
          id
        }
      }
    }
  `;

  const { data, error } = useQuery(query, { variables: { runId } });

  const { data: subscriptionData } = useSubscription(
    gql`
      subscription TaskRunLogs($Id: String!) {
        taskRunLogs(id: $id)
      }
    `,
    { variables: { id: runId } }
  );

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <MainLayout>
      <H1>
        <Link href={`${process.env.mountPath}/tasks/${taskName}`}>
          <A>{taskName}</A>
        </Link>
      </H1>
      <H2>Details</H2>
      <DetailsRow>
        Status: <span>{data?.taskRun.state}</span>
      </DetailsRow>
      <DetailsRow>
        Runtime:{" "}
        {displayTaskRunDuration(data?.taskRun.startTime, data?.taskRun.endTime)}
      </DetailsRow>
      <DetailsRow>Invocation Type {data?.taskRun.invocationType}</DetailsRow>
      <DetailsRow>
        Started at {new Date(data?.taskRun.startTime).toLocaleString()}
      </DetailsRow>
      {data?.taskRun.exitCode && (
        <DetailsRow>Exit Code: {data?.taskRun.exitCode}</DetailsRow>
      )}
      {data?.taskRun.exitSignal && (
        <DetailsRow>Exit Signal: {data?.taskRun.exitSignal}</DetailsRow>
      )}
      <H2>Payload</H2>
      <Editor readonly maxHeight={10} value={data?.taskRun.payload} />
      <H2>Logs</H2>
      <Editor readonly maxHeight={25} value={subscriptionData} language="log" />
    </MainLayout>
  );
};

export default withApollo(TaskRunPage);
