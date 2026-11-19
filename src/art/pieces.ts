/**
 * The origami pieces, each in a local box. Every fold is two faces: the colour, and the colour in shade (or lit),
 * split along a crease.
 */
import { shade, tint, type Pt, type Shape } from "./shapes";

/** An origami crane, side on, wings up: in a 420 × 250 box. */
export const crane = (c: string, k: string): Shape[] => [
  { poly: [[205, 172], [118, 6], [252, 164]], fill: shade(k, 0.28) }, // back wing
  { poly: [[136, 198], [50, 76], [178, 186]], fill: shade(c, 0.1) }, // neck
  { poly: [[50, 76], [22, 98], [60, 88]], fill: shade(c, 0.32) }, // head, folded down
  { poly: [[282, 198], [414, 92], [314, 186]], fill: shade(c, 0.1) }, // tail
  { poly: [[136, 198], [210, 168], [312, 198]], fill: c }, // body, top face
  { poly: [[136, 198], [312, 198], [222, 246]], fill: shade(c, 0.24) }, // body, under face
  { poly: [[212, 182], [334, 0], [258, 150]], fill: tint(k, 0.08) }, // front wing, lit
  { poly: [[258, 150], [334, 0], [276, 192]], fill: shade(k, 0.12) }, // front wing, past its crease
];

/** A paper dart climbing up and to the right, nose at the top right: in a 340 × 260 box. */
export const dart = (c: string): Shape[] => [
  { poly: [[340, 0], [120, 176], [150, 258]], fill: shade(c, 0.4) }, // keel, under the fold
  { poly: [[340, 0], [120, 176], [62, 238]], fill: shade(c, 0.18) }, // far wing
  { poly: [[340, 0], [0, 150], [120, 176]], fill: tint(c, 0.12) }, // near wing, lit
];

/** A folded tulip: head and stem, in a 200 × 420 box (the stem runs long, off the card). */
export const tulip = (c: string, leaf: string): Shape[] => [
  { poly: [[96, 170], [104, 170], [108, 420], [92, 420]], fill: shade(leaf, 0.2) },
  { poly: [[100, 300], [10, 214], [100, 262]], fill: leaf },
  { poly: [[100, 300], [100, 262], [40, 270]], fill: shade(leaf, 0.25) },
  { poly: [[100, 180], [20, 40], [66, 74]], fill: tint(c, 0.08) },
  { poly: [[100, 180], [180, 40], [134, 74]], fill: shade(c, 0.16) },
  { poly: [[100, 180], [66, 74], [100, 0], [134, 74]], fill: shade(c, 0.2) },
  { poly: [[100, 180], [66, 74], [100, 112]], fill: c },
  { poly: [[100, 180], [134, 74], [100, 112]], fill: shade(c, 0.08) },
];

/** A folded paper lantern, hung by the top of its cord (local y 0): in a 120 × 230 box. */
export const lantern = (c: string, gold: string): Shape[] => [
  { line: [60, 0, 60, 30], stroke: gold, width: 3 },
  { poly: [[38, 28], [82, 28], [82, 42], [38, 42]], fill: gold },
  { poly: [[38, 42], [60, 42], [60, 182], [38, 182], [6, 112]], fill: tint(c, 0.06) },
  { poly: [[60, 42], [82, 42], [114, 112], [82, 182], [60, 182]], fill: shade(c, 0.22) },
  { poly: [[6, 112], [114, 112], [112, 118], [8, 118]], fill: shade(c, 0.32) },
  { poly: [[20, 76], [100, 76], [102, 80], [18, 80]], fill: shade(c, 0.32) },
  { poly: [[18, 148], [102, 148], [100, 152], [20, 152]], fill: shade(c, 0.32) },
  { poly: [[38, 182], [82, 182], [82, 194], [38, 194]], fill: gold },
  { line: [60, 194, 60, 228], stroke: gold, width: 4 },
];

/** A water-bomb balloon, seen as a cube: lit top, mid left, shaded right, a fold, its tied tail. In 200 × 216. */
export const balloon = (c: string): Shape[] => [
  { poly: [[100, 0], [190, 48], [100, 96], [10, 48]], fill: tint(c, 0.18) },
  { poly: [[10, 48], [100, 96], [100, 200], [10, 152]], fill: c },
  { poly: [[100, 96], [190, 48], [190, 152], [100, 200]], fill: shade(c, 0.26) },
  { poly: [[100, 96], [100, 200], [56, 124]], fill: shade(c, 0.1) },
  { poly: [[90, 200], [110, 200], [100, 216]], fill: shade(c, 0.35) },
];

/** A party hat: a folded cone with a pom-pom, in a 140 × 200 box. */
export const hat = (c: string, pom: string): Shape[] => [
  { poly: [[70, 20], [0, 200], [70, 186]], fill: tint(c, 0.06) },
  { poly: [[70, 20], [70, 186], [140, 200]], fill: shade(c, 0.24) },
  { circle: [70, 18, 18], fill: pom },
];

/** A folded square of confetti: a diamond split on its crease. In 24 × 24. */
export const confetti = (c: string): Shape[] => [
  { poly: [[12, 0], [24, 12], [12, 24]], fill: shade(c, 0.24) },
  { poly: [[12, 0], [12, 24], [0, 12]], fill: tint(c, 0.06) },
];

/** A four-point folded star, in 60 × 60. */
export const star = (c: string): Shape[] => [
  { poly: [[30, 0], [38, 22], [30, 30]], fill: tint(c, 0.1) },
  { poly: [[60, 30], [38, 22], [30, 30]], fill: shade(c, 0.2) },
  { poly: [[30, 60], [22, 38], [30, 30]], fill: shade(c, 0.2) },
  { poly: [[0, 30], [22, 38], [30, 30]], fill: tint(c, 0.1) },
  { poly: [[30, 0], [22, 22], [30, 30]], fill: shade(c, 0.1) },
  { poly: [[60, 30], [38, 38], [30, 30]], fill: c },
  { poly: [[30, 60], [38, 38], [30, 30]], fill: shade(c, 0.3) },
  { poly: [[0, 30], [22, 22], [30, 30]], fill: c },
];

/** A folded cloud: half-discs faceted like a paper fan, the facets alternating lit and shaded. */
export const cloud = (c: string): Shape[] =>
  ([[0, 70, 70], [100, 30, 100], [212, 80, 64]] as const).flatMap(([x, y, r]): Shape[] => {
    const [cx, cy, facets] = [x + r, y + r, 6];
    const p = (i: number): Pt => [cx + r * Math.cos(Math.PI + (i * Math.PI) / facets), cy + r * Math.sin(Math.PI + (i * Math.PI) / facets)];
    return [
      ...Array.from({ length: facets }, (_, i): Shape => ({ poly: [[cx, cy], p(i), p(i + 1)], fill: i % 2 ? shade(c, 0.1) : tint(c, 0.12) })),
      { poly: [[x, cy], [x + 2 * r, cy], [x + 2 * r, cy + r], [x, cy + r]], fill: shade(c, 0.16) }, // under the crease
    ];
  });

/** Dots, as [cx, cy, r]. */
export const dots = (pts: Array<[number, number, number]>, fill: string): Shape[] => pts.map(([x, y, r]) => ({ circle: [x, y, r], fill }));
