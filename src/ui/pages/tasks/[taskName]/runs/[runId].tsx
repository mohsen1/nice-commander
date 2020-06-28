import React, { useContext } from "react";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "react-apollo";
import Link from "next/link";
import { Card, Elevation, ButtonGroup, Button } from "@blueprintjs/core";
import prettyBytes from "pretty-bytes";

import MainLayout from "../../../../layouts/MainLayout";
import ErrorPresenter from "../../../../components/ErrorPresentor";
import RunButton from "../../../../components/RunButton";
import { withApollo } from "../../../../lib/apollo";
import { displayTaskRunDuration } from "../../../../components/utils/time";
import { AppContext } from "../../../../context/AppContext";
import LogViewer from "../../../../components/LogViewer";
import { H3, H4 } from "../../../../components/headings";
import { getBackgroundColorForStatus } from "../../../../components/utils/colors";

const stopTaskRunMutation = gql`
  mutation StopTaskRun($taskRunId: String!) {
    stopTaskRun(id: $taskRunId)
  }
`;

const getTaskRunQuery = gql`
  query GetTaskRun($runId: String!) {
    taskRun(id: $runId) {
      endTime
      startTime
      state
      payload
      id
      invocationSource
      runnerName
      runnerEmail
      hostname
      freemem
      exitCode
      exitSignal
      loadavg
      uniqueId
      task {
        name
        id
      }
    }
  }
`;

const TaskRunDetail: React.FC<{
  title: string;
  value?: string;
  metadata?: string;
}> = ({ title, value, metadata }) => {
  if (!value) return null;

  return (
    <p>
      <b>{title}: </b>
      <span>{value}</span>
      {metadata && <span> ({metadata})</span>}
    </p>
  );
};

const TaskRunPage: React.FC = () => {
  const { taskName, runId } = useRouter().query;

  const { data, error, stopPolling } = useQuery(getTaskRunQuery, {
    variables: {
      runId,
    },
    pollInterval: 1000,
    notifyOnNetworkStatusChange: true,
  });

  const [stopTaskRun] = useMutation(stopTaskRunMutation);

  if (error) {
    stopPolling();
    return <ErrorPresenter error={error} />;
  }

  if (data?.taskRun?.state && data?.taskRun?.state !== "RUNNING") {
    stopPolling();
  }

  const appContext = useContext(AppContext);

  return (
    <MainLayout>
      <Card
        elevation={Elevation.ONE}
        style={{
          marginBottom: 20,
          backgroundColor: getBackgroundColorForStatus(data?.taskRun.state),
        }}
      >
        <H3>
          <Link
            prefetch={false}
            href={`${appContext?.baseUrl}/tasks/${taskName}`}
          >
            <a>
              {data?.taskRun?.state}: {taskName}
            </a>
          </Link>
        </H3>

        <ButtonGroup style={{ marginBottom: "1rem" }}>
          {data?.taskRun?.state === "RUNNING" && (
            <Button
              text="stop"
              intent="danger"
              icon="stop"
              onClick={() =>
                stopTaskRun({
                  variables: {
                    taskRunId: data?.taskRun?.id,
                  },
                })
              }
            />
          )}
          {data?.taskRun?.state !== "RUNNING" && (
            <RunButton
              text="Run again"
              taskId={data?.taskRun?.task?.id}
              taskName={data?.taskRun?.task?.name}
            />
          )}
        </ButtonGroup>
        <TaskRunDetail
          title="Started by"
          value={data?.taskRun.runnerName}
          metadata={data?.taskRun.runnerEmail}
        />
        <TaskRunDetail title="Hostname" value={data?.taskRun.hostname} />
        <TaskRunDetail
          title="System free memory"
          value={data?.taskRun?.freemem && prettyBytes(data?.taskRun?.freemem)}
        />
        <TaskRunDetail
          title="System load average"
          value={data?.taskRun?.loadavg
            .split(", ")
            .map((la) => parseFloat(la).toFixed(2) + "%")
            .join(", ")}
        />

        <TaskRunDetail
          title="Duration"
          value={displayTaskRunDuration(
            data?.taskRun.startTime,
            data?.taskRun.endTime
          )}
        />
        <TaskRunDetail
          title="Invocation source"
          value={data?.taskRun.invocationSource}
        />

        <TaskRunDetail title="Exit code" value={data?.taskRun?.exitCode} />
        <TaskRunDetail title="Exit signal" value={data?.taskRun?.exitSignal} />

        <TaskRunDetail
          title="Start time"
          value={new Date(data?.taskRun.startTime).toLocaleString()}
          metadata={new Date(data?.taskRun.startTime).getTime().toFixed()}
        />

        <p>Payload</p>
        <pre>{data?.taskRun.payload}</pre>
      </Card>
      <Card elevation={Elevation.ONE}>
        <H4>Logs</H4>
        <LogViewer
          taskRunId={runId as string}
          isRunning={data?.taskRun.state === "RUNNING"}
          uniqueId={data?.taskRun.uniqueId}
        />
      </Card>
    </MainLayout>
  );
};

export default withApollo(TaskRunPage);
