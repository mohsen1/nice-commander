import React from "react";
import { styled } from "linaria/react";

import Header from "../components/Header";
import Footer from "../components/Footer";

const Main = styled.main`
  margin: 1rem auto;
  padding: 0 1rem;
  max-width: 85rem;
  min-width: min(65rem, 100vw);
`;

const Container = styled.div`
  margin: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
`;

const MainLayout: React.FC = ({ children }) => (
  <Container>
    <Header />
    <Main>{children}</Main>
    <Footer />
  </Container>
);

export default MainLayout;
