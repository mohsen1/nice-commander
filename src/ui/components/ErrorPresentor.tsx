import React from "react";
import { styled } from "linaria/react";

const ErrorMessage = styled.pre`
  padding: 1rem;
  font-family: monospace;
  background: var(--color-fail-dim);
  color: var(--color-text);
`;

const ErrorPresenter: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    return <ErrorMessage>{error.stack}</ErrorMessage>;
  }
  return null;
};

export default ErrorPresenter;
