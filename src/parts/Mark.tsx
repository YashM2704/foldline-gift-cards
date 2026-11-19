import { Line, Polygon, Svg } from "@hyper-elements/react";

type P = [number, number];
/** Where a corner lands when the paper is folded along the line a→b. */
export const reflect = (c: P, a: P, b: P): P => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t = ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const [px, py] = [a[0] + t * dx, a[1] + t * dy];
  return [2 * px - c[0], 2 * py - c[1]];
};
export const points = (p: P[]) => p.map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join(" ");

/** Foldline's mark: a square of paper, its corner folded along an off-axis crease, as the card's is. */
export function Mark({ color, fold, size = 30 }: { color: string; fold: string; size?: number }) {
  const [a, b]: [P, P] = [[12, 0], [30, 20]];
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" title="">
      <Polygon points={points([[0, 0], a, b, [30, 30], [0, 30]])} style={{ fill: color }} />
      <Polygon points={points([a, b, reflect([30, 0], a, b)])} style={{ fill: fold }} />
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: color, strokeWidth: 1.2 }} />
    </Svg>
  );
}
