import React, { useContext } from "react";
import styled from "styled-components";
import Link from "next/link";

import A from "./base/A";
import { AppContext } from "../context/AppContext";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";

const Title = styled.h1`
  font-size: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderElement = styled.header`
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.colors.accent.normal};
`;

const ViewerDiv = styled.div`
  font-size: 10px;
`;

const query = gql`
  query GetViewer {
    viewer {
      name
      email
    }
  }
`;

const Header: React.FC = () => {
  const appContext = useContext(AppContext);
  const { data } = useQuery(query);

  return (
    <HeaderElement>
      <Title>
        <Link prefetch={false} href={appContext?.baseUrl || "/"}>
          <A>Nice Commander</A>
        </Link>
        <ViewerDiv>
          <A href={`mailto:${data?.viewer?.email}`}>{data?.viewer?.name}</A>
        </ViewerDiv>
      </Title>
    </HeaderElement>
  );
};
export default Header;
