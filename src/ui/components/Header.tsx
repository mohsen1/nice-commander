import React from "react";
import styled from "styled-components";

const Title = styled.h1`
  font-size: 2em;
`;

const HeaderElement = styled.header`
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.colors.accent.normal};
`;

const Header: React.FC = () => (
  <HeaderElement>
    <Title>Nice Commander</Title>
  </HeaderElement>
);

export default Header;
