/* eslint-disable @typescript-eslint/no-var-requires */
const withCSS = require("@zeit/next-css");

module.exports = (overrides) =>
  withCSS({
    // https://github.com/palantir/blueprint/issues/4149
    // Blueprint uses the old context API
    reactStrictMode: false,

    publicRuntimeConfig: {
      baseUrl: "/",
    },
    cssLoaderOptions: {
      url: false,
    },
    ...overrides,
    webpack(config) {
      config.module.rules.push({
        test: /\.(js|tsx|ts)$/,
        use: [
          {
            loader: "linaria/loader",
            options: {
              sourceMap: process.env.NODE_ENV !== "production",
            },
          },
        ],
      });

      return config;
    },
  });
