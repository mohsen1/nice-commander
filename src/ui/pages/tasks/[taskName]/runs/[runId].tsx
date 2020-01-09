import React from "react";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useQuery } from "react-apollo";
import Editor from "@monaco-editor/react";

import MainLayout from "../../../../layouts/MainLayout";
import ErrorPresenter from "../../../../components/ErrorPresentor";
import H1 from "../../../../components/titles/H1";
import { withApollo } from "../../../../lib/apollo";
import H2 from "../../../../components/titles/H2";

const TaskRunPage: React.FC = () => {
  const router = useRouter();
  const { taskName, runId } = router.query;
  const query = gql`
    query GetTaskRun {
      taskRun(id: "${runId}") {
          endTime
          startTime
          state
          logs
          payload
          id
          task {
          name
          id
          }
      }
    }`;

  const { data, error } = useQuery(query);

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <MainLayout>
      <H1>{taskName}</H1>
      <H2>Details</H2>
      <p>
        Status: <span>{data?.taskRun.state}</span>
      </p>
      <p>Started at {new Date(data?.taskRun.startTime).toLocaleString()}</p>
      <H2>Payload</H2>
      <Editor
        value={data?.taskRun.payload}
        language="json"
        height="200px"
        options={{ readonly: true, minimap: { enabled: false } }}
      />
      <H2>Logs</H2>
      <Editor
        value={data?.taskRun.logs}
        language="log"
        height="200px"
        options={{ readonly: true, minimap: { enabled: false } }}
      />
    </MainLayout>
  );
};

export default withApollo(TaskRunPage);
