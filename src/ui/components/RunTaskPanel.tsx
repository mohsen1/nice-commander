import React, { useState } from "react";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import { styled } from "linaria/react";
import Router from "next/router";
import { Button, Classes } from "@blueprintjs/core";

import Editor from "./Editor";
import { H2 } from "./headings";

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
  let getEditorValueRef = () => "";
  const [isValidPayload, setIsValidPayload] = useState<boolean>(true);
  function getPayloadSafe() {
    try {
      // make sure input is valid JSON
      const value = JSON.stringify(JSON.parse(getEditorValueRef()));
      setIsValidPayload(true);
      return value;
    } catch (e) {
      setIsValidPayload(false);
      return "{}";
    }
  }
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
      <H2>Run</H2>
      <p>Enter this run's payload:</p>
      <Editor
        value={defaultValue}
        height="150px"
        editorDidMount={(getEditorValue) =>
          (getEditorValueRef = getEditorValue)
        }
      />
      <InvalidJSONError>
        {!isValidPayload && "Invalid JSON in payload"}
      </InvalidJSONError>
      <Buttons>
        <Button
          large
          intent="primary"
          text="Run"
          onClick={async () => {
            const { data } = await runTask({
              variables: {
                payload: getPayloadSafe(),
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
