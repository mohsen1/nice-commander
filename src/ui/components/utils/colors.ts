import { ThemeType } from "../../themes/type";

type Status = "FINISHED" | "RUNNING" | "ERROR" | "TIMED_OUT";

export function getBackgroundColorForStatus(status: Status, theme: ThemeType) {
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
    case "TIMED_OUT":
      if (theme.name !== "dark") return theme.colors.gray.light;
      else return theme.colors.gray.dark;
  }
}
export function getForegroundColorForStatus(status: Status, theme: ThemeType) {
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
    case "TIMED_OUT":
      if (theme.name !== "dark") return theme.colors.gray.normal;
      else return theme.colors.gray.dark;
  }
}
