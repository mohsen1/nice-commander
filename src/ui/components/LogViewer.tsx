import React, { useState, useRef, useContext } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { uniqBy, sortBy } from "lodash";
import { Button } from "@blueprintjs/core";

import Editor from "./Editor";
import ErrorPresenter from "./ErrorPresentor";
import { AppContext } from "../context/AppContext";

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

interface LogViewerProps {
  taskRunId: string;
  isRunning?: boolean;
  logStreamName: string;
  taskName: string;
}

const LogViewer: React.FC<LogViewerProps> = ({
  taskRunId,
  isRunning,
  logStreamName,
  taskName,
}) => {
  const pollInterval = 1_000;
  const appContext = useContext(AppContext);

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

  if (error) {
    stopPolling();
    return <ErrorPresenter error={error} />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
        }}
      >
        <span>
          <a
            target="_blank"
            rel="noreferrer"
            href={`${appContext.baseUrl}/logs/${taskName}/${logStreamName}`}
          >
            Full logs
          </a>
          {" · "}
          <a
            target="_blank"
            rel="noreferrer"
            href={`${appContext.baseUrl}/logs/${taskName}/${logStreamName}?mode=formatted`}
          >
            Full logs (formatted)
          </a>
        </span>
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
        value={allLogs.map((l) => l.message).join("")}
        language="log"
        follow={isLive}
      />
    </div>
  );
};

export default LogViewer;
