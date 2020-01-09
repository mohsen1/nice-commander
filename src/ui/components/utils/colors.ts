import { ThemeType } from "../../themes/type";

export function getBackgroundColorForStatus(
  status: "FINISHED" | "RUNNING" | "ERROR",
  theme: ThemeType
) {
  switch (status) {
    case "ERROR":
      if (theme.name === "dark") return theme.colors.fail.dark;
      else return theme.colors.fail.light;
    case "FINISHED":
      if (theme.name === "dark") return theme.colors.success.dark;
      else return theme.colors.success.light;
    case "RUNNING":
      if (theme.name === "dark") return theme.colors.progress.dark;
      else return theme.colors.progress.light;
  }
}
export function getForegroundColorForStatus(
  status: "FINISHED" | "RUNNING" | "ERROR",
  theme: ThemeType
) {
  switch (status) {
    case "ERROR":
      if (theme.name !== "dark") return theme.colors.fail.dark;
      else return theme.colors.fail.light;
    case "FINISHED":
      if (theme.name !== "dark") return theme.colors.success.dark;
      else return theme.colors.success.light;
    case "RUNNING":
      if (theme.name !== "dark") return theme.colors.progress.dark;
      else return theme.colors.progress.normal;
  }
}

export function isDarkModeEnabled() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}
