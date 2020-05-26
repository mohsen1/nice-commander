import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }

    :root {
        --color-background: white;
        --color-text: black;
        --color-accent-dark: #1252bd;
        --color-accent-normal: #4771b7;
        --color-accent-light: #96b9f3;
        --color-gray-light: #efefef;
        --color-gray-normal: #888888;
        --color-gray-dark: #333333;
        --color-success-dark: darkgreen;
        --color-success-normal: green;
        --color-success-light: lightgreen;
        --color-fail-dark: darkred;
        --color-fail-normal: red;
        --color-fail-light: #f9b8b8;
        --color-progress-dark: #9ea718;
        --color-progress-normal: #eaea1d;
        --color-progress-light: #fdfdcd;
        --color-warning-normal: orange;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            /* Absolute black and white is too harsh */
            --color-background: #202020;
            --color-text: #d6d6d6;;

            --color-accent-dark: #1252bd;
            --color-accent-normal: #4771b7;
            --color-accent-light: #96b9f3;
            --color-gray-light: #efefef;
            --color-gray-normal: #888888;
            --color-gray-dark: #333333;
            --color-success-dark: darkgreen;
            --color-success-normal: green;
            --color-success-light: lightgreen;
            --color-fail-dark: darkred;
            --color-fail-normal: red;
            --color-fail-light: #f9b8b8;
            --color-progress-dark: #9ea718;
            --color-progress-normal: #a0a00a;
            --color-progress-light: #fdfdcd;
            --color-warning-normal: orange;
        }
    }

    body {
            color: var(--color-text);
            background: var(--color-background);
        }

`;
