import React from "react";
import { AppProps } from "next/app";
import getConfig from "next/config";

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import GlobalStyles from "../themes/global";
import { AppContext } from "../context/AppContext";

const SetTheme = () => {
  React.useLayoutEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("bp3-dark");
    }
  });
  return null;
};

const NiceCommanderApp = (props: AppProps) => {
  const { Component, pageProps } = props;
  const { publicRuntimeConfig } = getConfig();
  const isServer = typeof window === "undefined";

  return (
    <AppContext.Provider value={{ baseUrl: publicRuntimeConfig.baseUrl }}>
      <GlobalStyles />
      {!isServer && <SetTheme />}
      <Component {...pageProps} />
    </AppContext.Provider>
  );
};

export default NiceCommanderApp;
