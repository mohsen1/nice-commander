import React from "react";
import App, { AppInitialProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { Reset } from "styled-reset";
import { parseCookies, setCookie, destroyCookie } from "nookies";

import defaultTheme from "../themes/default";
import darkTheme from "../themes/dark";
import GlobalStyles from "../themes/global";

interface NiceCommanderAppProps {
  theme: "dark" | "light";
}

export default class NiceCommanderApp extends App<NiceCommanderAppProps> {
  static async getInitialProps(ctx): Promise<AppInitialProps> {
    const pageProps: NiceCommanderAppProps = {
      theme: "light"
    };
    parseCookies(ctx);

    if (typeof window !== "undefined") {
      const matches = window.matchMedia?.("(prefers-color-scheme: dark)")
        .matches;

      if (matches) {
        pageProps.theme = "dark";
      }
      setCookie(ctx, "theme", matches ? "dark" : "light", { path: "/" });
    }

    if (ctx.req) {
      pageProps.theme = ctx.req.cookie.theme;
    }

    return {
      pageProps
    };
  }
  /**
   * @todo
   * To avoid flashing set a cookie for theme preference in client and use that cookie
   * in subsequent requests to render with dark theme in server
   */
  private get theme() {
    if (this.props.pageProps.theme === "dark") {
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
