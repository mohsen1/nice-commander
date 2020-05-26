import React, { useState } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";

import Editor from "./Editor";
import BaseButton from "./buttons/BaseButton";
import ErrorPresenter from "./ErrorPresentor";
import { throttle } from "lodash";

const query = gql`
  query GetLogs($taskRunId: String!, $nextToken: String) {
    taskRunLogs(id: $taskRunId, nextToken: $nextToken) {
      events {
        timestamp
        message
      }
      nextForwardToken
    }
  }
`;

const LogViewer: React.FC<{ taskRunId: string; isRunning?: boolean }> = ({
  taskRunId,
  isRunning,
}) => {
  const [nextToken, setNextToken] = useState();
  const [isLive, goLive] = useState(false);
  const [allLogs, setLogs] = useState([]);
  const { error, refetch } = useQuery(query, {
    variables: { taskRunId },
    onCompleted(data) {
      setLogs((all) => [...all, ...(data?.taskRunLogs?.events ?? [])]);

      if (
        // Get more logs if it is live
        isLive ||
        // Paginate if there is more logs
        (nextToken && data?.logEvents?.nextForwardToken !== nextToken)
      ) {
        throttledRefetch({
          taskRunId,
          // @ts-ignore
          nextToken: data?.logEvents?.nextForwardToken,
        });
      }
    },
  });

  const throttledRefetch = throttle(refetch, 1000);
  const value = allLogs
    .map(
      ({ message, timestamp }) =>
        `${new Date(timestamp).toLocaleTimeString()} -- ${message}`
    )
    .join("\n");

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <div>
      {isRunning && (
        <BaseButton onClick={() => goLive((isLive) => !isLive)}>
          {isLive ? "Stop" : "Go Live"}
        </BaseButton>
      )}
      <Editor readonly maxHeight={25} value={value} language="log" />
    </div>
  );
};

export default LogViewer;
