import { ThemeType } from "./type";

const darkTheme: ThemeType = {
  name: "dark",
  colors: {
    background: "black",
    text: "white",

    accent: {
      dark: "#1252bd",
      normal: "#4771b7",
      light: "#96b9f3"
    },

    gray: {
      light: "#efefef",
      normal: "#888",
      dark: "#333"
    },

    success: {
      dark: "darkgreen",
      normal: "green",
      light: "lightgreen"
    },

    fail: {
      dark: "darkred",
      normal: "red",
      light: "lightred"
    },

    progress: {
      dark: "yellow",
      normal: "gold",
      light: "lightyellow"
    },

    warning: {
      normal: "orange"
    }
  }
};

export default darkTheme;
