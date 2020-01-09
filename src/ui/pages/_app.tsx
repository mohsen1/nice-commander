import React from "react";
import App from "next/app";
import { ThemeProvider } from "styled-components";
import { Reset } from "styled-reset";

import defaultTheme from "../themes/default";
import darkTheme from "../themes/dark";
import GlobalStyles from "../themes/global";

export default class NiceCommanderApp extends App {
  /**
   * @todo
   * To avoid flashing set a cookie for theme preference in client and use that cookie
   * in subsequent requests to render with dark theme in server
   */
  private get theme() {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return darkTheme;
    }

    return defaultTheme;
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={this.theme}>
        <Reset />
        <GlobalStyles />
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}
