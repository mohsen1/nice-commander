import React, { useContext } from "react";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useQuery } from "react-apollo";
import Link from "next/link";
import { Card, Elevation } from "@blueprintjs/core";

import MainLayout from "../../../../layouts/MainLayout";
import ErrorPresenter from "../../../../components/ErrorPresentor";
import RunButton from "../../../../components/RunButton";
import { withApollo } from "../../../../lib/apollo";
import { displayTaskRunDuration } from "../../../../components/utils/time";
import { AppContext } from "../../../../context/AppContext";
import LogViewer from "../../../../components/LogViewer";
import { H3, H4 } from "../../../../components/headings";
import { getBackgroundColorForStatus } from "../../../../components/utils/colors";

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
              {taskName} - {new Date(data?.taskRun.startTime).toLocaleString()}
            </a>
          </Link>
        </H3>
        <p>
          <RunButton
            text="Run again"
            taskId={data?.taskRun?.task?.id}
            taskName={data?.taskRun?.task?.name}
          />
        </p>
        <p>
          Started by:{" "}
          <a href={`mailto://${data?.taskRun.runnerEmail}`}>
            {data?.taskRun.runnerName}{" "}
          </a>
        </p>
        <p>
          Status: <span>{data?.taskRun.state}</span>
        </p>
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
            Started at {new Date(data?.taskRun.startTime).toISOString()} -{" "}
            {new Date(data?.taskRun.startTime).getTime()}
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
