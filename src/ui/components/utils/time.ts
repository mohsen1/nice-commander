export function displayTaskRunDuration(
  startTime: number,
  endTime?: number | null
) {
  if (!endTime) {
    return "...";
  }
  const diffSeconds = (endTime - startTime) / 1000;
  if (diffSeconds < 60) {
    return `${diffSeconds} s`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);

  return `${diffMinutes} m`;
}
