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
      loadavg
      task {
        name
        id
      }
    }
  }
`;

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
        <p>
          <ButtonGroup>
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
        </p>
        {data?.taskRun.runnerName && (
          <p>
            Started by:{" "}
            <a href={`mailto://${data?.taskRun.runnerEmail}`}>
              {data?.taskRun.runnerName}{" "}
            </a>
          </p>
        )}

        <p>
          Hostname: <span>{data?.taskRun.hostname}</span>
        </p>
        <p>
          System free memory:{" "}
          <span>
            {data?.taskRun?.freemem && prettyBytes(data?.taskRun?.freemem)}
          </span>
        </p>
        {data?.taskRun?.loadavg && (
          <p>
            System load average:{" "}
            <span>
              {data?.taskRun?.loadavg
                .split(", ")
                .map((la) => parseFloat(la).toFixed(2) + "%")
                .join(", ")}
            </span>
          </p>
        )}
        <p>
          Runtime:{" "}
          {displayTaskRunDuration(
            data?.taskRun.startTime,
            data?.taskRun.endTime
          )}
        </p>
        <p>Invocation source: {data?.taskRun.invocationSource}</p>
        {data?.taskRun.startTime && (
          <p>
            Started at {new Date(data?.taskRun.startTime).toLocaleString()}{" "}
            <code>{new Date(data?.taskRun.startTime).getTime()}</code>
          </p>
        )}
        <p>Payload</p>
        <pre>{data?.taskRun.payload}</pre>
      </Card>
      <Card elevation={Elevation.ONE}>
        <H4>Logs</H4>
        <LogViewer
          taskRunId={runId as string}
          isRunning={data?.taskRun.state === "RUNNING"}
        />
      </Card>
    </MainLayout>
  );
};

export default withApollo(TaskRunPage);
