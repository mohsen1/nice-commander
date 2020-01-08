import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }

    @media (prefers-color-scheme: dark) {
        /* Absolute black nad white is too harsh */
        body {
            color: #d6d6d6;
            background: #202020;
        }
    }

`;
