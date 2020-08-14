import React, { useState } from "react";
import { useRouter } from "next/router";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";
import { Card, Elevation, Button, ButtonGroup } from "@blueprintjs/core";
import { styled } from "linaria/react";

import MainLayout from "../../../layouts/MainLayout";
import Editor from "../../../components/Editor";
import TaskRunRow from "../../../components/TaskRunRow";
import ErrorPresenter from "../../../components/ErrorPresentor";
import { withApollo } from "../../../lib/apollo";
import RunButton from "../../../components/RunButton";
import { H3, H4 } from "../../../components/headings";

const Details = styled.div`
  display: grid;
  grid-column-gap: 1rem;
  grid-template-columns: 1fr auto;
`;

interface TaskPageProps {
  taskName: string;
}

const TaskPage: React.FC<TaskPageProps> = () => {
  const router = useRouter();
  const { taskName } = router.query;
  const query = gql`
    query GetTask($runsPage: Int = 0, $runsPageSize: Int) {
      task(name: "${taskName}") {
        name
        description
        id
        schedule
        code
        timeoutAfterDescription
        runs(skip: $runsPage, take: $runsPageSize) {
          id
          state
          startTime
          endTime
          payload
        }
      }
    }
  `;
  type QueryType = {
    task: {
      name: string;
      description: string;
      id: string;
      schedule: string;
      code: string;
      timeoutAfterDescription: string;
      runs: Array<{
        id: string;
        state: string;
        startTime: number;
        endTime: number;
        payload: string;
      }>;
    };
  };
  const PAGE_SIZE = 5;
  const { data, error, fetchMore } = useQuery<QueryType>(query, {
    variables: {
      runsPage: 0,
      runsPageSize: PAGE_SIZE,
    },
  });

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <MainLayout>
      <Card elevation={Elevation.ONE} style={{ marginBottom: 20 }}>
        <H3>{data?.task?.name}</H3>
        <Details>
          <div>
            <p>{data?.task?.description}</p>
            <p>
              {data?.task?.schedule === "manual"
                ? "Manual invocation only"
                : `Runs every ${data?.task?.schedule}`}
            </p>
            <p>Times out after {data?.task?.timeoutAfterDescription}</p>
          </div>
          <div>
            <RunButton taskId={data?.task?.id} taskName={data?.task?.name} />
          </div>
        </Details>

        <Editor readonly value={data?.task?.code} language="typescript" />
      </Card>
      <H4>Latest Runs</H4>
      {data?.task?.runs?.map((run) => (
        <TaskRunRow key={run.startTime} taskName={data?.task?.name} {...run} />
      ))}
      <ButtonGroup minimal>
        <Button
          className="bp3-minimal"
          icon="bring-data"
          onClick={() => {
            fetchMore({
              variables: {
                runsPageSize: PAGE_SIZE,
                runsPage: data?.task?.runs?.length ?? 0,
              },
              updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;

                return {
                  task: {
                    ...prev.task,
                    runs: [
                      ...(prev?.task?.runs ?? []),
                      ...(fetchMoreResult?.task?.runs ?? []),
                    ],
                  },
                };
              },
            });
          }}
        >
          Load more
        </Button>
      </ButtonGroup>
    </MainLayout>
  );
};

export default withApollo(TaskPage);
