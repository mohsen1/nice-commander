import React, { useState, useRef } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { uniqBy, sortBy } from "lodash";
import { Button } from "@blueprintjs/core";

import Editor from "./Editor";
import ErrorPresenter from "./ErrorPresentor";

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
  const pollInterval = 1_000;

  const [nextToken, setNextToken] = useState<string | undefined>();
  const [isLive, goLive] = useState(isRunning);
  const [allLogs, setLogs] = useState([]);
  const { error, stopPolling, startPolling, refetch } = useQuery(query, {
    pollInterval,
    notifyOnNetworkStatusChange: true,
    get variables() {
      return { taskRunId, nextToken };
    },
    onCompleted(data) {
      setLogs((all) => {
        const combined = [...all, ...(data?.taskRunLogs?.events ?? [])];
        const unique = uniqBy(combined, (l) => l.timestamp);
        const sorted = sortBy(unique, (l) => l.timestamp);

        return sorted;
      });

      const newToken = data?.taskRunLogs?.nextForwardToken;

      // Paginate if there are more logs. We know there are more logs because token has changed.
      if (!isLive && newToken && newToken !== nextToken) {
        refetch({ taskRunId, nextToken });
      }

      setNextToken(newToken);
    },
  });

  const value = allLogs
    .map(
      ({ message, timestamp }) =>
        `${new Date(timestamp).toLocaleTimeString()} ${message}`
    )
    .join("");

  if (error) {
    stopPolling();
    return <ErrorPresenter error={error} />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "10px 0",
        }}
      >
        <Button
          intent={isLive ? "success" : "primary"}
          icon="refresh"
          onClick={() => {
            goLive((oldValue) => {
              const isLive = !oldValue;
              if (isLive) {
                startPolling(pollInterval);
              } else {
                stopPolling();
              }
              return isLive;
            });
          }}
          text={isLive ? "Stop streaming" : "Start streaming"}
        />
      </div>

      <Editor
        readonly
        maxHeight={25}
        value={value}
        language="log"
        follow={isLive}
      />
    </div>
  );
};

export default LogViewer;
