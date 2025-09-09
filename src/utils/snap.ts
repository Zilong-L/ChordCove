export type SnapType = "whole" | "eighth" | "sixteenth";

// Snap a beat value to the nearest grid based on snap type.
// Ensures nearest snapping (e.g., 0.30 → 0.25 for sixteenth),
// and avoids returning 0 by using the minimal positive step.
export function snapToGrid(beats: number, snapType: SnapType): number {
  if (snapType === "whole") return Math.max(1, Math.round(beats));

  const whole = Math.floor(beats);
  const frac = beats - whole;

  let snappedFrac: number;
  if (snapType === "eighth") {
    // Allowed fractions: 0, 0.5, 1
    snappedFrac = frac < 0.25 ? 0 : frac < 0.75 ? 0.5 : 1;
  } else {
    // sixteenth: Allowed fractions: 0, 0.25, 0.5, 0.75, 1
    if (frac < 0.125) snappedFrac = 0;
    else if (frac < 0.375) snappedFrac = 0.25;
    else if (frac < 0.625) snappedFrac = 0.5;
    else if (frac < 0.875) snappedFrac = 0.75;
    else snappedFrac = 1;
  }

  const snapped = whole + snappedFrac;
  if (snapped === 0) return snapType === "eighth" ? 0.5 : 0.25;
  return snapped;
}
