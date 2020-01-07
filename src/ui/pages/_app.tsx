import React from "react";
import App from "next/app";
import { ApolloProvider } from "react-apollo";
import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import fetch from "isomorphic-unfetch";

export default class NiceCommanderApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    const client = new ApolloClient({
      ssrMode: false,
      link: new HttpLink({
        fetch,
        uri: "http://localhost:3000/nice-commander/graphql"
      }),
      cache: new InMemoryCache()
    });

    return (
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    );
  }
}
