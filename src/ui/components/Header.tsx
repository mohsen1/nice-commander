import React from "react";
import Link from "next/link";
import { Navbar, Alignment, Button } from "@blueprintjs/core";
import getConfig from "next/config";

import gql from "graphql-tag";
import { useQuery } from "react-apollo";

const query = gql`
  query GetViewer {
    viewer {
      name
      email
    }
  }
`;

const Header: React.FC = () => {
  const { data } = useQuery(query);
  const { publicRuntimeConfig } = getConfig();
  return (
    <Navbar>
      <Navbar.Group align={Alignment.LEFT}>
        <Navbar.Heading>
          <Link prefetch={false} href={""}>
            <a>Nice Commander</a>
          </Link>
        </Navbar.Heading>
        <Navbar.Divider />
      </Navbar.Group>
      <Navbar.Group align={Alignment.RIGHT}>
        <Button className="bp3-minimal" icon="user" text={data?.viewer?.name} />
      </Navbar.Group>
    </Navbar>
  );
};
export default Header;
