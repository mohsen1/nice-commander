import React from "react";
import App from "next/app";
import { ThemeProvider } from "styled-components";
import { Reset } from "styled-reset";

import defaultTheme from "../themes/default";
import darkTheme from "../themes/dark";
import GlobalStyles from "../themes/global";
import { isDarkModeEnabled } from "../components/utils/colors";

export default class NiceCommanderApp extends App {
  /**
   * @todo
   * To avoid flashing set a cookie for theme preference in client and use that cookie
   * in subsequent requests to render with dark theme in server
   */
  private get theme() {
    if (isDarkModeEnabled()) {
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
