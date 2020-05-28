import React from "react";
import App from "next/app";
import { ThemeProvider } from "styled-components";
import { Reset } from "styled-reset";
import getConfig from "next/config";

import defaultTheme from "../themes/default";
import GlobalStyles from "../themes/global";
import { AppContext } from "../context/AppContext";

export default class NiceCommanderApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    const { publicRuntimeConfig } = getConfig();

    return (
      <AppContext.Provider value={{ baseUrl: publicRuntimeConfig.baseUrl }}>
        <ThemeProvider theme={defaultTheme}>
          <Reset />
          <GlobalStyles />
          <Component {...pageProps} />
        </ThemeProvider>
      </AppContext.Provider>
    );
  }
}
