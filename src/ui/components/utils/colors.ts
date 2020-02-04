import { ThemeType } from "../../themes/type";

type Status = "FINISHED" | "RUNNING" | "ERROR" | "TIMED_OUT";

export function getBackgroundColorForStatus(status: Status, theme: ThemeType) {
  switch (status) {
    case "ERROR":
      return theme.colors.fail.light;
    case "FINISHED":
      return theme.colors.success.light;
    case "RUNNING":
      return theme.colors.progress.light;
    case "TIMED_OUT":
      return theme.colors.gray.light;
  }
}
export function getForegroundColorForStatus(status: Status, theme: ThemeType) {
  switch (status) {
    case "ERROR":
      return theme.colors.fail.normal;
    case "FINISHED":
      return theme.colors.success.normal;
    case "RUNNING":
      return theme.colors.progress.normal;
    case "TIMED_OUT":
      return theme.colors.gray.normal;
  }
}
