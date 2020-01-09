import React from "react";
import styled from "styled-components";
import Link from "next/link";

const Title = styled.h1`
  font-size: 1.2em;
`;

const A = styled.a`
  text-decoration: none;
  color: white;
  cursor: pointer;
`;

const HeaderElement = styled.header`
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.colors.accent.normal};
`;

const Header: React.FC = () => (
  <HeaderElement>
    <Title>
      <Link href={process.env.mountPath}>
        <A>Nice Commander</A>
      </Link>
    </Title>
  </HeaderElement>
);

export default Header;
