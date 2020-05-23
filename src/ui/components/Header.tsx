import React, { useContext } from "react";
import styled from "styled-components";
import Link from "next/link";

import A from "./base/A";
import { AppContext } from "../context/AppContext";

const Title = styled.h1`
  font-size: 1.2em;
`;
const HeaderElement = styled.header`
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.colors.accent.normal};
`;

const Header: React.FC = () => {
  const { baseUrl } = useContext(AppContext);

  return (
    <HeaderElement>
      <Title>
        <Link prefetch={false} href={baseUrl}>
          <A>Nice Commander</A>
        </Link>
      </Title>
    </HeaderElement>
  );
};
export default Header;
