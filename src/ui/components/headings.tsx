import React from "react";
import { css, cx } from "linaria";

const color = css`
  color: var(--color-text);
`;

export const H1 = (props: JSX.IntrinsicElements["h1"]) => (
  <h1 className={cx("bp3-heading", color, props.className)} {...props} />
);

export const H2 = (props: JSX.IntrinsicElements["h1"]) => (
  <h2 className={cx("bp3-heading", color, props.className)} {...props} />
);

export const H3 = (props: JSX.IntrinsicElements["h1"]) => (
  <h3 className={cx("bp3-heading", color, props.className)} {...props} />
);

export const H4 = (props: JSX.IntrinsicElements["h1"]) => (
  <h4 className={cx("bp3-heading", color, props.className)} {...props} />
);
