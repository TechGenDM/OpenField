/**
 * Formats a duration in seconds into MM:SS format.
 * Clamps negative numbers to "00:00".
 * Examples: 60 -> "01:00", 59 -> "00:59", 0 -> "00:00"
 */
export function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0 || isNaN(totalSeconds)) {
    return "00:00";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return `${mm}:${ss}`;
}

/**
 * Calculates remaining seconds from a target timestamp and current timestamp.
 * Avoids React interval drift by basing calculations on absolute time differences.
 */
export function calculateRemainingSeconds(
  targetEndTimeMs: number,
  currentNowMs: number
): number {
  const diffMs = targetEndTimeMs - currentNowMs;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 1000);
}

/**
 * Safely clamps a step index within [0, totalSteps - 1].
 */
export function clampStepIndex(index: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.max(0, Math.min(index, totalSteps - 1));
}
