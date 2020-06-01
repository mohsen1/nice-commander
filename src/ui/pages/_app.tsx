import React from "react";
import { AppProps } from "next/app";
import getConfig from "next/config";

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import GlobalStyles from "../themes/global";
import { AppContext } from "../context/AppContext";

const NiceCommanderApp = (props: AppProps) => {
  const { Component, pageProps } = props;
  const { publicRuntimeConfig } = getConfig();

  return (
    <AppContext.Provider value={{ baseUrl: publicRuntimeConfig.baseUrl }}>
      <GlobalStyles />
      <Component {...pageProps} />
    </AppContext.Provider>
  );
};

export default NiceCommanderApp;
