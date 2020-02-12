import React from "react";
import App from "next/app";
import { ThemeProvider } from "styled-components";
import { Reset } from "styled-reset";

import defaultTheme from "../themes/default";
import GlobalStyles from "../themes/global";
import { AppContext } from "../context/AppContext";

interface AppProps {
  baseUrl?: string | null;
}

export default class NiceCommanderApp extends App<AppProps> {
  static async getInitialProps({ ctx, Component }) {
    let pageProps: AppProps = {};

    if (Component.getInitialProps) {
      let compAsyncProps = await Component.getInitialProps(ctx);
      pageProps = { ...pageProps, ...compAsyncProps };
    }
    if (ctx?.req?.baseUrl) {
      pageProps.baseUrl = ctx?.req?.baseUrl;
    }

    return { pageProps };
  }
  render() {
    const { Component, pageProps } = this.props;

    return (
      <AppContext.Provider value={{ baseUrl: pageProps.baseUrl }}>
        <ThemeProvider theme={defaultTheme}>
          <Reset />
          <GlobalStyles />
          <Component {...pageProps} />
        </ThemeProvider>
      </AppContext.Provider>
    );
  }
}
