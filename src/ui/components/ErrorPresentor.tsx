import React from "react";
import styled from "styled-components";

const ErrorMessage = styled.pre`
  padding: 1rem;
  font-family: monospace;
  background: ${({ theme }) => {
    if (theme.name === "dark") {
      return theme.colors.fail.dark;
    }
    return theme.colors.fail.light;
  }};

  color: ${({ theme }) => {
    if (theme.name === "dark") {
      return theme.colors.fail.light;
    }
    return theme.colors.fail.dark;
  }};
`;

const ErrorPresenter: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    return <ErrorMessage>{error.stack}</ErrorMessage>;
  }
  return null;
};

export default ErrorPresenter;
