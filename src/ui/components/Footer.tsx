import React from "react";
import styled from "styled-components";

const FooterElement = styled.footer`
  padding: 0.3rem 1rem;
  text-align: center;
  font-size: 0.5rem;
  color: ${(props) => props.theme.colors.gray.dark};
  background: ${(props) => props.theme.colors.gray.light};
`;

const AttributeLink = styled.a`
  color: ${(props) => props.theme.colors.gray.dark};
  text-decoration: none;
`;

const Footer: React.FC = () => (
  <FooterElement>
    <AttributeLink href="https://github.com/mohsen1/nice-commander">
      Docs
    </AttributeLink>
    {" · "}
    <AttributeLink href="https://github.com/mohsen1/nice-commander">
      Github Repo
    </AttributeLink>
  </FooterElement>
);

export default Footer;
