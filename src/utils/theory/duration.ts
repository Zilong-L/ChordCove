export function getUnderlineCount(duration: number): number {
  if (duration === 1 || duration === 1.5) return 0;
  if (duration === 0.5 || duration === 0.75) return 1;
  if (duration === 0.25 || duration === 0.375) return 2;
  if (duration === 0.125 || duration === 0.1875) return 3;
  return 0;
}

export function isDotted(duration: number): boolean {
  return [1.5, 0.75, 0.375, 0.1875].includes(duration);
}
