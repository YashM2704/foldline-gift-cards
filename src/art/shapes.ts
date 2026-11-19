/**
 * Folded-paper art as data: polygons, circles, lines and curves in a local box, placed and scaled onto the card.
 * Drawn twice by drawShapes(): once offset in the shadow's colour, once in their own colours.
 */
import { createElement, type ReactElement } from "react";
import { Circle, Line, Path, Polygon } from "@hyper-elements/react";

export type Pt = [number, number];
export type Shape =
  | { poly: Pt[]; fill: string }
  | { circle: [cx: number, cy: number, r: number]; fill: string }
  | { line: [x1: number, y1: number, x2: number, y2: number]; stroke: string; width: number }
  | { curve: [x1: number, y1: number, cx: number, cy: number, x2: number, y2: number]; stroke: string; width: number };

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** A colour part-way to another (t from 0 to 1). */
export const mix = (from: string, to: string, t: number) => {
  const [a, b] = [hex(from), hex(to)];
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
/** A face turned away from the light, and one turned toward it. */
export const shade = (c: string, t = 0.24) => mix(c, "#1E1A2B", t);
export const tint = (c: string, t = 0.35) => mix(c, "#FFFFFF", t);
/** Relative luminance, 0 (black) to 1 (white). */
export const luminance = (c: string) => {
  const [r, g, b] = hex(c).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const isDark = (c: string) => luminance(c) < 0.4;

/** Shapes from a local box, moved to (x, y) and scaled by s. */
export const place = (shapes: Shape[], x: number, y: number, s = 1): Shape[] =>
  shapes.map((sh) => {
    if ("poly" in sh) return { ...sh, poly: sh.poly.map(([px, py]) => [x + px * s, y + py * s] as Pt) };
    if ("circle" in sh) return { ...sh, circle: [x + sh.circle[0] * s, y + sh.circle[1] * s, sh.circle[2] * s] };
    if ("line" in sh) return { ...sh, line: [x + sh.line[0] * s, y + sh.line[1] * s, x + sh.line[2] * s, y + sh.line[3] * s], width: sh.width * s };
    const [a, b, c, d, e, f] = sh.curve;
    return { ...sh, curve: [x + a * s, y + b * s, x + c * s, y + d * s, x + e * s, y + f * s], width: sh.width * s };
  });

/** A string that sags: a quadratic curve, the point on it at t (0…1), and its y at x, so what hangs from it touches it. */
export const sag = (x1: number, y1: number, x2: number, y2: number, drop: number) => {
  const [cx, cy] = [(x1 + x2) / 2, (y1 + y2) / 2 + drop * 2];
  const at = (t: number): Pt => [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2];
  const yAt = (x: number) => {
    let [lo, hi] = [0, 1]; // x grows along the string, so bisect on t
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid)[0] < x) lo = mid;
      else hi = mid;
    }
    return at((lo + hi) / 2)[1];
  };
  return { curve: [x1, y1, cx, cy, x2, y2] as [number, number, number, number, number, number], at, yAt };
};

const n = (v: number) => Math.round(v * 10) / 10;

/** The shapes as Svg elements: in their own colours, or all in one (a shadow), offset by (dx, dy). */
export function drawShapes(shapes: Shape[], o: { dx?: number; dy?: number; color?: string } = {}): ReactElement[] {
  const dx = o.dx ?? 0, dy = o.dy ?? 0;
  return shapes.map((sh, key) => {
    if ("poly" in sh) return createElement(Polygon, { key, points: sh.poly.map(([x, y]) => `${n(x + dx)},${n(y + dy)}`).join(" "), style: { fill: o.color ?? sh.fill } });
    if ("circle" in sh) return createElement(Circle, { key, cx: n(sh.circle[0] + dx), cy: n(sh.circle[1] + dy), r: n(sh.circle[2]), style: { fill: o.color ?? sh.fill } });
    if ("line" in sh) return createElement(Line, { key, x1: n(sh.line[0] + dx), y1: n(sh.line[1] + dy), x2: n(sh.line[2] + dx), y2: n(sh.line[3] + dy), style: { stroke: o.color ?? sh.stroke, strokeWidth: sh.width } });
    const [a, b, c, d, e, f] = sh.curve;
    return createElement(Path, { key, d: `M${n(a + dx)} ${n(b + dy)} Q${n(c + dx)} ${n(d + dy)} ${n(e + dx)} ${n(f + dy)}`, style: { fill: "transparent", stroke: o.color ?? sh.stroke, strokeWidth: sh.width } });
  });
}
