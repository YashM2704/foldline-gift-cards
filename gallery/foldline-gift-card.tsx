/**
 * Foldline (a fictional paper shop) gives a birthday gift card: the card's face as a PNG, 1084 by 710,
 * written by @hyper-elements/react/image. The one-file version of the kit's card-image template, with
 * Priya's gift written in.
 *
 * Every Foldline card is a piece of folded paper. The art is origami, drawn in Svg shapes: each fold is
 * two faces, the colour and the colour in shade, and every piece drops a soft shadow onto the card.
 * Bunting comes in off the top edge, a water-bomb balloon floats on its string, and two party hats sit
 * at the bottom. The card's corner is folded along an off-axis crease. Fraunces for the words, Red Hat
 * Mono for the label.
 *
 * In the kit, the words are measured from the fonts' own glyph widths and sized to fit the card's text
 * column. Here they're the sizes it measured for this gift: the greeting at 44px, the amount at 132px.
 */
import { Canvas, Circle, Column, Layer, Line, Path, Polygon, Row, Svg, Text } from "@hyper-elements/react";

export const meta = {
  title: "Foldline gift card",
  description: "A birthday gift card as a PNG: origami bunting, a balloon and party hats in Svg shapes, the corner folded.",
  root: "Canvas",
};

const PAPER = "#F6F1E7";
const INK = "#1E1A2B";
// The birthday palette: a peach ground, three paper colours, and the words' colour on the ground.
const GROUND = "#FFE1D2";
const CORAL = "#FF6B4A";
const MARIGOLD = "#FFC23D";
const VIOLET = "#7B61FF";
const PLUM = "#3A1730";

const SERIF = "Fraunces, Georgia, 'Times New Roman', serif";
const MONO = "'Red Hat Mono', Menlo, Consolas, monospace";

// ---------- colour ----------

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** A colour part-way to another (t from 0 to 1). */
const mix = (from: string, to: string, t: number) => {
  const [a, b] = [hex(from), hex(to)];
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
/** A face turned away from the light, and one turned toward it. */
const shade = (c: string, t: number) => mix(c, INK, t);
const tint = (c: string, t: number) => mix(c, "#FFFFFF", t);

// ---------- the card ----------

/** The card, 1012 by 638 (a bank card's shape), with 36px of room all round for its shadow. */
const W = 1012;
const H = 638;
const R = 32;
const M = 36;

type P = [number, number];
/** Where a corner lands when the paper is folded along the line a→b. */
const reflect = (c: P, a: P, b: P): P => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t = ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / (dx * dx + dy * dy);
  return [2 * (a[0] + t * dx) - c[0], 2 * (a[1] + t * dy) - c[1]];
};
const n = (v: number) => Math.round(v * 10) / 10;
const points = (p: P[]) => p.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");

/** The fold: in 118px from the corner along the top, 100px down the side, the corner reflected across the crease. */
const FA: P = [W - 118, 0];
const FB: P = [W, 100];
const FLAP = reflect([W, 0], FA, FB);

/** The card's edge: rounded corners, and the top right cut off along the crease. */
const outline = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - (W - FA[0])} L${x + w} ${y + FB[1]} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;

// ---------- the origami ----------

type Shape =
  | { poly: P[]; fill: string }
  | { circle: [cx: number, cy: number, r: number]; fill: string }
  | { line: [x1: number, y1: number, x2: number, y2: number]; stroke: string; width: number }
  | { curve: [x1: number, y1: number, cx: number, cy: number, x2: number, y2: number]; stroke: string; width: number };

/** A piece: faces and dots, drawn in a local box. */
type Piece = Extract<Shape, { fill: string }>;
/** A piece's shapes moved to (x, y) and scaled by s. */
const place = (shapes: Piece[], x: number, y: number, s = 1): Shape[] =>
  shapes.map((sh) =>
    "poly" in sh
      ? { ...sh, poly: sh.poly.map(([px, py]): P => [x + px * s, y + py * s]) }
      : { ...sh, circle: [x + sh.circle[0] * s, y + sh.circle[1] * s, sh.circle[2] * s] },
  );

/** A water-bomb balloon, seen as a cube: lit top, the colour on the left, shaded right, a fold, its tied tail. */
const balloon = (c: string): Piece[] => [
  { poly: [[100, 0], [190, 48], [100, 96], [10, 48]], fill: tint(c, 0.18) },
  { poly: [[10, 48], [100, 96], [100, 200], [10, 152]], fill: c },
  { poly: [[100, 96], [190, 48], [190, 152], [100, 200]], fill: shade(c, 0.26) },
  { poly: [[100, 96], [100, 200], [56, 124]], fill: shade(c, 0.1) },
  { poly: [[90, 200], [110, 200], [100, 216]], fill: shade(c, 0.35) },
];

/** A party hat: a folded cone with a pom-pom. */
const hat = (c: string, pom: string): Piece[] => [
  { poly: [[70, 20], [0, 200], [70, 186]], fill: tint(c, 0.06) },
  { poly: [[70, 20], [70, 186], [140, 200]], fill: shade(c, 0.24) },
  { circle: [70, 18, 18], fill: pom },
];

/** A folded square of confetti: a diamond split on its crease. */
const confetti = (c: string): Piece[] => [
  { poly: [[12, 0], [24, 12], [12, 24]], fill: shade(c, 0.24) },
  { poly: [[12, 0], [12, 24], [0, 12]], fill: tint(c, 0.06) },
];

/** The bunting's string, a curve that sags: it comes in off the top edge and is pinned under the fold's crease. */
const STRING: [number, number, number, number, number, number] = [556, -4, 728, 59, 900, 18];
/** The string's height at x, so each flag hangs from it. Its bend sits midway, so x moves evenly along it. */
const stringAt = (x: number) => {
  const [x1, y1, , cy, x2, y2] = STRING;
  const t = (x - x1) / (x2 - x1);
  return (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2;
};

/** Five flags on the string, each folded down its middle: one face lit, one in shade. */
const bunting = [CORAL, MARIGOLD, VIOLET, CORAL, MARIGOLD].flatMap((c, i): Shape[] => {
  const [x0, x1] = [576 + i * 62, 622 + i * 62];
  const [y0, y1] = [stringAt(x0), stringAt(x1)];
  const mid: P = [(x0 + x1) / 2, (y0 + y1) / 2];
  const tip: P = [mid[0] - 4, mid[1] + 46];
  return [
    { poly: [[x0, y0], mid, tip], fill: tint(c, 0.05) },
    { poly: [mid, [x1, y1], tip], fill: shade(c, 0.22) },
  ];
});

/** The art lives in the right of the card, clear of the words, and bleeds off its right and bottom edges. */
const ART: Shape[] = [
  { curve: STRING, stroke: shade(GROUND, 0.35), width: 2 },
  ...bunting,
  { line: [770, 418, 752, 700], stroke: shade(GROUND, 0.4), width: 2.5 },
  ...place(balloon(VIOLET), 680, 200, 0.94),
  ...place(hat(CORAL, MARIGOLD), 590, 420, 1.1),
  ...place(hat(MARIGOLD, CORAL), 846, 360, 1.4),
  ...place(confetti(VIOLET), 628, 196),
  ...place(confetti(CORAL), 920, 232, 0.9),
  ...place(confetti(MARIGOLD), 600, 318, 0.8),
  ...place(confetti(CORAL), 960, 300, 0.7),
];

/** The shapes as Svg elements: in their own colours, or all in one colour, offset (their shadow). */
const draw = (shapes: Shape[], shadow?: { dx: number; dy: number; color: string }) =>
  shapes.map((sh, key) => {
    const [dx, dy] = shadow ? [shadow.dx, shadow.dy] : [0, 0];
    if ("poly" in sh) return <Polygon key={key} points={points(sh.poly.map(([x, y]): P => [x + dx, y + dy]))} style={{ fill: shadow?.color ?? sh.fill }} />;
    if ("circle" in sh) return <Circle key={key} cx={n(sh.circle[0] + dx)} cy={n(sh.circle[1] + dy)} r={n(sh.circle[2])} style={{ fill: shadow?.color ?? sh.fill }} />;
    if ("line" in sh) {
      const [x1, y1, x2, y2] = sh.line;
      return <Line key={key} x1={n(x1 + dx)} y1={n(y1 + dy)} x2={n(x2 + dx)} y2={n(y2 + dy)} style={{ stroke: shadow?.color ?? sh.stroke, strokeWidth: sh.width }} />;
    }
    const [x1, y1, cx, cy, x2, y2] = sh.curve;
    const d = `M${n(x1 + dx)} ${n(y1 + dy)} Q${n(cx + dx)} ${n(cy + dy)} ${n(x2 + dx)} ${n(y2 + dy)}`;
    return <Path key={key} d={d} style={{ fill: "transparent", stroke: shadow?.color ?? sh.stroke, strokeWidth: sh.width }} />;
  });

/** Foldline's mark: a square of paper, its corner folded along an off-axis crease, as the card's is. */
function Mark() {
  const [a, b]: [P, P] = [[12, 0], [30, 20]];
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" title="">
      <Polygon points={points([[0, 0], a, b, [30, 30], [0, 30]])} style={{ fill: PLUM }} />
      <Polygon points={points([a, b, reflect([30, 0], a, b)])} style={{ fill: mix(PLUM, GROUND, 0.55) }} />
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: PLUM, strokeWidth: 1.2 }} />
    </Svg>
  );
}

export default function FoldlineGiftCard() {
  return (
    <Canvas
      width={W + 2 * M}
      height={H + 2 * M}
      lang="en"
      title="Happy birthday, Priya: a Foldline gift card for ₹2,500"
      fonts={[
        { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NVf8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9vIVYX9G37lvd9sPEKsxx664UJf1hLTc7frUo.ttf", format: "truetype", weight: 400, style: "italic" },
        { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcaRyTB_7W.ttf", format: "truetype", weight: 600 },
        { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcUByTB_7W.ttf", format: "truetype", weight: 700 },
        { family: "Red Hat Mono", src: "https://fonts.gstatic.com/s/redhatmono/v16/jVyY7nDnA2uf2zVvFAhhzEs-VMSjJpBTfgjwQYPPy7bHvQ.ttf", format: "truetype", weight: 600 },
      ]}
      style={{ backgroundColor: PAPER, fontFamily: SERIF }}
    >
      <Layer style={{ width: W + 2 * M, height: H + 2 * M }}>
        {/* The card's soft shadow: five layers of faint ink, each a little lower and wider. */}
        <Svg width={W + 2 * M} height={H + 2 * M} viewBox={`0 0 ${W + 2 * M} ${H + 2 * M}`} title="">
          {[0, 1, 2, 3, 4].map((i) => (
            <Path key={i} d={outline(M + i * 2, M + 8 + i * 4, W - i, H - i, R + i * 2)} style={{ fill: INK, opacity: 0.05 }} />
          ))}
        </Svg>
        {/* The card: its ground, the art (clipped to the card's rounded edge), and the folded corner. */}
        <Column style={{ width: W + 2 * M, height: H + 2 * M, padding: M }}>
          <Column style={{ width: W, height: H, borderRadius: R, overflow: "hidden" }}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} title="Paper bunting in coral, marigold and violet strung across the top, a folded violet balloon on a string, and two party hats.">
              <Path d={outline(0, 0, W, H, R)} style={{ fill: GROUND }} />
              {draw(ART, { dx: 9, dy: 11, color: mix(GROUND, INK, 0.3) })}
              {draw(ART)}
              <Polygon points={points([FA, FB, FLAP].map(([x, y]): P => [x - 9, y + 9]))} style={{ fill: INK, opacity: 0.22 }} />
              <Polygon points={points([FA, FB, FLAP])} style={{ fill: mix(GROUND, INK, 0.15) }} />
              <Line x1={FA[0]} y1={FA[1]} x2={FB[0]} y2={FB[1]} style={{ stroke: INK, strokeWidth: 1.5, opacity: 0.35 }} />
            </Svg>
          </Column>
        </Column>
        {/* The words: the shop and the label at the top, the greeting and the amount at the bottom, in a 480px column. */}
        <Column style={{ width: W + 2 * M, height: H + 2 * M, padding: [M + 44, M + 52, M + 40, M + 52], justifyContent: "space-between", color: PLUM }}>
          <Column style={{ gap: 10 }}>
            <Row stackOnMobile={false} style={{ gap: 12, alignItems: "center" }}>
              <Mark />
              <Text style={{ flex: "none", fontSize: 36, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1 }}>Foldline</Text>
            </Row>
            <Text style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase" }}>Gift card</Text>
          </Column>
          <Column style={{ gap: 6, width: 480 }}>
            <Text style={{ fontSize: 44, fontStyle: "italic", fontWeight: 400, lineHeight: 1.1 }}>Happy birthday, Priya</Text>
            <Text style={{ fontSize: 132, fontWeight: 700, lineHeight: 1.04, letterSpacing: -3.3 }}>₹2,500</Text>
          </Column>
        </Column>
      </Layer>
    </Canvas>
  );
}
