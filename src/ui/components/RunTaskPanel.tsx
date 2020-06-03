import React, { useState } from "react";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import { styled } from "linaria/react";
import Router from "next/router";
import { Button, Classes } from "@blueprintjs/core";

import Editor from "./Editor";

const InvalidJSONError = styled.p`
  text-align: right;
  padding: 1rem;
  color: var(--color-fail-normal);
`;

const Buttons = styled.div`
  text-align: right;
`;

/** Default editor value. This has proper spacing and new lines */
const defaultValue = `{
  
}
`;

const RunTaskPanel: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [editorValue, setEditorValue] = useState(defaultValue);
  const [isValidPayload, setIsValidPayload] = useState<boolean>(true);

  const [runTask] = useMutation(gql`
    mutation Run($taskId: String!, $payload: String!) {
      runTask(id: $taskId, payload: $payload) {
        payload
        id
        startTime
        endTime
      }
    }
  `);

  return (
    <div className={Classes.DIALOG_BODY}>
      <p>Enter this run's payload:</p>
      <Editor
        value={defaultValue}
        height="150px"
        editorDidMount={(_, editor) => {
          editor.onDidChangeModelContent((event) => {
            const value = editor.getValue();
            setEditorValue(value);
            try {
              JSON.parse(value);
              setIsValidPayload(true);
            } catch {
              setIsValidPayload(false);
            }
          });
        }}
      />
      <InvalidJSONError>
        {!isValidPayload && "Invalid JSON in payload"}
      </InvalidJSONError>
      <Buttons>
        <Button
          large
          icon="play"
          intent="primary"
          text="Run"
          disabled={!isValidPayload}
          onClick={async () => {
            const { data } = await runTask({
              variables: {
                payload: editorValue,
                taskId,
              },
            });
            Router.push(
              window.location.pathname + "/runs/" + data?.runTask?.id
            );
          }}
        />
      </Buttons>
    </div>
  );
};

export default RunTaskPanel;
