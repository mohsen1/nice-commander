import React, { useState } from "react";
import { useRouter } from "next/router";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";
import { Card, Elevation, Button, Dialog } from "@blueprintjs/core";
import { styled } from "linaria/react";

import MainLayout from "../../../layouts/MainLayout";
import Editor from "../../../components/Editor";
import TaskRunRow from "../../../components/TaskRunRow";
import ErrorPresenter from "../../../components/ErrorPresentor";
import { withApollo } from "../../../lib/apollo";
import RunTaskPanel from "../../../components/RunTaskPanel";
import { H3, H4 } from "../../../components/headings";

const Details = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
`;

interface TaskPageProps {
  taskName: string;
}

const TaskPage: React.FC<TaskPageProps> = () => {
  const router = useRouter();
  const { taskName } = router.query;
  const query = gql`
    query GetTask {
      task(name: "${taskName}") {
        name
        id
        schedule
        code
        timeoutAfterDescription
        runs {
          id
          state
          startTime
          endTime
          payload
        }
      }
    }
  `;
  const { data, error } = useQuery(query, { pollInterval: 2000 });

  const [isRunDialogOpen, setRunDialogOpen] = useState(false);

  if (error) {
    return <ErrorPresenter error={error} />;
  }

  return (
    <MainLayout>
      <Card elevation={Elevation.ONE} style={{ marginBottom: 20 }}>
        <H3>{data?.task?.name}</H3>
        <Details>
          <div>
            <p>
              {data?.task?.schedule === "manual"
                ? "Manual invocation only"
                : `Runs every ${data?.task?.schedule}`}
            </p>
            <p>Times out after {data?.task?.timeoutAfterDescription}</p>
          </div>
          <div>
            <Button
              icon="play"
              text="Run"
              intent="primary"
              onClick={() => setRunDialogOpen(true)}
            />
          </div>
        </Details>

        <Editor readonly value={data?.task?.code} language="typescript" />
      </Card>
      <Dialog
        icon="play"
        title={`Run "${data?.task?.name}"`}
        isOpen={isRunDialogOpen}
        onClose={() => setRunDialogOpen(false)}
        canOutsideClickClose
        canEscapeKeyClose
      >
        <RunTaskPanel taskId={data?.task?.id} />
      </Dialog>
      <H4>Latest Runs</H4>
      {data?.task?.runs?.map((run) => (
        <TaskRunRow key={run.startTime} taskName={data?.task?.name} {...run} />
      ))}
    </MainLayout>
  );
};

export default withApollo(TaskPage);
