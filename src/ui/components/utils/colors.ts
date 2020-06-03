export type Status = "FINISHED" | "RUNNING" | "ERROR" | "TIMED_OUT";

export function getBackgroundColorForStatus(status: Status) {
  switch (status) {
    case "ERROR":
      return "var(--color-fail-dim)";
    case "FINISHED":
      return "var(--color-success-dim)";
    case "RUNNING":
      return "var(--color-progress-dim)";
    case "TIMED_OUT":
      return "var(--color-gray-dim)";
  }
}
export function getForegroundColorForStatus(status: Status) {
  switch (status) {
    case "ERROR":
      return "var(--color-fail-normal)";
    case "FINISHED":
      return "var(--color-success-normal)";
    case "RUNNING":
      return "var(--color-progress-normal)";
    case "TIMED_OUT":
      return "var(--color-gray-normal)";
  }
}
