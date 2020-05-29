import React from "react";
import App from "next/app";
import getConfig from "next/config";

import GlobalStyles from "../themes/global";
import { AppContext } from "../context/AppContext";

export default class NiceCommanderApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    const { publicRuntimeConfig } = getConfig();

    return (
      <AppContext.Provider value={{ baseUrl: publicRuntimeConfig.baseUrl }}>
        <GlobalStyles />
        <Component {...pageProps} />
      </AppContext.Provider>
    );
  }
}
