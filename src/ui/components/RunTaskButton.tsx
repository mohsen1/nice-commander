import React, { useState } from "react";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import styled from "styled-components";

import Run from "./buttons/Run";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1rem 0;
`;

const Buttons = styled.div`
  text-align: right;
`;

const Payload = styled.textarea`
  padding: 0.5rem;
  min-height: 4rem;
  margin-bottom: 0.5rem;
  font-family: monospace;
`;

const RunTaskButton: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [payload, setPayload] = useState("");
  function getPayloadSafe() {
    try {
      // make sure input is valid JSON
      return JSON.stringify(JSON.parse(payload));
    } catch {}
    return "{}";
  }
  const [runTask] = useMutation(gql`
    mutation Run {
        runTask(id: "${taskId}", payload: "${getPayloadSafe()}") {
          payload
          id
          logs
          startTime
          endTime
        }
      }
    `);

  return (
    <Container>
      <Payload
        placeholder="Payload (JSON)"
        value={payload}
        onChange={e => setPayload(e.target.value)}
      />
      <Buttons>
        <Run onClick={runTask}>Run</Run>
      </Buttons>
    </Container>
  );
};

export default RunTaskButton;
