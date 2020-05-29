import { css } from "linaria";

const reset = `

/* http://meyerweb.com/eric/tools/css/reset/
   v5.0.1 | 20191019
   License: none (public domain)
*/

html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, menu, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
main, menu, nav, output, ruby, section, summary,
time, mark, audio, video {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
	vertical-align: baseline;
}
/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure,
footer, header, hgroup, main, menu, nav, section {
	display: block;
}
/* HTML5 hidden-attribute fix for newer browsers */
*[hidden] {
    display: none;
}
body {
	line-height: 1;
}
menu, ol, ul {
	list-style: none;
}
blockquote, q {
	quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
	content: '';
	content: none;
}
table {
	border-collapse: collapse;
	border-spacing: 0;
}
`;

export default css`
  :global() {
    ${reset}

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
        "Segoe UI Symbol";
    }

    :root {
      --color-background: white;
      --color-text: black;
      --color-accent-bold: #1252bd;
      --color-accent-normal: #c6dbff;
      --color-accent-dim: #96b9f3;
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

    html,
    body {
      margin: 0;
      color: var(--color-text);
      background: var(--color-background);
    }
  }
`;
