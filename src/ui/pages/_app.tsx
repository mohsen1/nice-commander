import React from "react";
import App, { AppInitialProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { Reset } from "styled-reset";

import defaultTheme from "../themes/default";
import GlobalStyles from "../themes/global";

export default class NiceCommanderApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={defaultTheme}>
        <Reset />
        <GlobalStyles />
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}
