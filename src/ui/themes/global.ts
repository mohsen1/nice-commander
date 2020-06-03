import { css } from "linaria";

export default css`
  :global() {
    :root {
      --color-background: white;
      --color-text: black;
      --color-accent-bold: #1252bd;
      --color-accent-normal: #c6dbff;
      --color-accent-dim: #e6f1f8;
      --color-gray-bold: #444444;
      --color-gray-normal: #2b1d1d;
      --color-gray-dim: #d3d3d3;
      --color-success-bold: darkgreen;
      --color-success-normal: green;
      --color-success-dim: lightgreen;
      --color-fail-bold: darkred;
      --color-fail-normal: red;
      --color-fail-dim: #f9b8b8;
      --color-progress-bold: #9ea718;
      --color-progress-normal: #b98819;
      --color-progress-dim: #fcfce7;
      --color-warning-normal: orange;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        /* Absolute black and white is too harsh */
        --color-background: #202020;
        --color-text: #d6d6d6;
        --color-accent-bold: #4878c9;
        --color-accent-normal: #059aff;
        --color-accent-dim: #1e54ae;
        --color-gray-bold: #efefef;
        --color-gray-normal: #888888;
        --color-gray-dim: #333333;
        --color-success-bold: darkgreen;
        --color-success-normal: green;
        --color-success-dim: lightgreen;
        --color-fail-bold: darkred;
        --color-fail-normal: #ee3333;
        --color-fail-dim: #642f2f;
        --color-progress-bold: #d0dd01;
        --color-progress-normal: #a0a00a;
        --color-progress-dim: #817a03;
        --color-warning-normal: orange;
      }
    }

    html,
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
        "Segoe UI Symbol";
      margin: 0;
      color: var(--color-text);
      background: var(--color-background);
    }
    a,
    a:hover {
      text-decoration: none;
    }

    .bp3-dark .bp3-card {
      background-color: transparent;
    }
  }
`;
