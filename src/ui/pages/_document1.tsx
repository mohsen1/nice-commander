import React from "react";
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentProps,
} from "next/document";

function prefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

class MyDocument extends Document<DocumentProps> {
  render() {
    return (
      <Html>
        <Head />
        <body className={prefersDark() ? "bp3-dark" : "bp3-body"}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
