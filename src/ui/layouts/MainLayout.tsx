import React from "react";
import styled from "styled-components";

import Header from "../components/Header";
import Footer from "../components/Footer";

const Main = styled.main`
  margin: 1rem;
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
