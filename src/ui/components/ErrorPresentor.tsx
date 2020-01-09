import React from "react";
import styled from "styled-components";

const ErrorMessage = styled.div`
  background: ${({ theme }) => {
    if (theme.name === "dark") {
      return theme.colors.error.dark;
    }
    return theme.colors.error.light;
  }};

  color: ${({ theme }) => {
    if (theme.name === "dark") {
      return theme.colors.error.light;
    }
    return theme.colors.error.dark;
  }};
`;

const ErrorPresenter: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    return <ErrorMessage>{error.stack}</ErrorMessage>;
  }
  return null;
};

export default ErrorPresenter;
