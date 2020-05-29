import React from "react";
import { styled } from "linaria/react";

const FooterElement = styled.footer`
  padding: 0.3rem 1rem;
  text-align: center;
  font-size: 0.5rem;
  color: var(--color-gray-bold);
  background: var(--color-gray-dim);
`;

const AttributeLink = styled.a`
  color: var(--color-gray-bold);
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
