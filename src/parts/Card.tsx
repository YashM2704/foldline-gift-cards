/**
 * The gift card: one component for every root. The PNG draws it at 1012px, the balance page at ~400px, the PDF at
 * 112.5 mm; everything in it, art and type, scales with `width`. Every text on it is measured at the card's own
 * size (1012px) and drawn as measured, so it lays out the same at any scale.
 */
import { Column, Layer, Line, Path, Polygon, Row, Svg, Text } from "@hyper-elements/react";
import { COMPOSE } from "../art/compose";
import { drawShapes, isDark, mix } from "../art/shapes";
import { FOLDLINE, INK, OCCASIONS, type Occasion, type OccasionStyle } from "../brand";
import { CARD_COLUMN, fitSize, fitWrapped, Lines, measure, money, NAME_FLOOR, steps } from "../text";
import { Mark, points, reflect } from "./Mark";

/** The card's own size, in its own px. */
export const W = 1012;
export const H = 638;
const R = 32;
// the fold: in 118px from the corner along the top, 100px down the side, the corner reflected across the crease
type P = [number, number];
const FA: P = [W - 118, 0], FB: P = [W, 100], FLAP = reflect([W, 0], FA, FB);
const outline = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - (W - FA[0])} L${x + w} ${y + FB[1]} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;

/**
 * The room around the card for its shadow, in the card's px (top, right, bottom, left):
 * `even` all round (an image of the card alone) · `flush` none left/top (the email: lines up with its text) ·
 * `drop` straight down only, the image exactly the card's width (share images: lines up on both edges) ·
 * `none` no shadow (the PDF: a printed card needs none).
 */
export const FRAMES = { even: [36, 36, 36, 36], flush: [0, 30, 34, 0], drop: [0, 0, 34, 0], none: [0, 0, 0, 0] } as const;
export type Frame = keyof typeof FRAMES;
/** The size the card takes up with its frame, at a given card width. */
export const frameSize = (frame: Frame, width = W) => {
  const [t, r, b, l] = FRAMES[frame];
  const s = width / W;
  return { width: Math.round((W + l + r) * s), height: Math.round((H + t + b) * s) };
};

export interface CardProps {
  occasion: Occasion;
  amount: number;
  currency: string;
  locale: string;
  to: string;
  shopName?: string;
  showAmount?: boolean;
  frame?: Frame;
  /** The card's visible width in the root's px (default: its own 1012). */
  width?: number;
}

const greet = { fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400 } as const;

/** The greeting and the amount, measured at the card's own size; sizes come back in card px. */
export function layoutWords(p: Pick<CardProps, "occasion" | "amount" | "currency" | "locale" | "to" | "showAmount">, o: OccasionStyle) {
  if (p.showAmount === false) {
    // the value hidden: the greeting is the face's words. Line one fitted up to 84px. The name: one line at 44px
    // or more; else two lines at 40px or more (broken at a space or after a hyphen); else one line down to 28px.
    const l1 = `${o.greet},`;
    const s1 = fitSize(l1, "fraunces-400i", CARD_COLUMN, 84, 40);
    const name =
      fitWrapped(p.to, "fraunces-400i", CARD_COLUMN, steps(s1, 44), 1) ??
      fitWrapped(p.to, "fraunces-400i", CARD_COLUMN, steps(Math.min(s1, 60), 40), 2) ?? {
        size: fitSize(p.to, "fraunces-400i", CARD_COLUMN, 44, NAME_FLOOR),
        lines: [p.to],
      };
    return { hidden: true as const, lead: { size: s1, lines: [l1] }, name };
  }
  // the greeting on one line if it fits at 38px or more; else broken after the comma, both lines at one size
  const one = `${o.greet}, ${p.to}`;
  const greeting =
    measure(one, "fraunces-400i", 38) <= CARD_COLUMN
      ? { size: fitSize(one, "fraunces-400i", CARD_COLUMN, 44, 38), lines: [one] }
      : { size: Math.min(fitSize(`${o.greet},`, "fraunces-400i", CARD_COLUMN, 44, NAME_FLOOR), fitSize(p.to, "fraunces-400i", CARD_COLUMN, 44, NAME_FLOOR)), lines: [`${o.greet},`, p.to] };
  const text = money(p.amount, p.currency, p.locale);
  return { hidden: false as const, greeting, amount: { text, size: fitSize(text, "fraunces-700", CARD_COLUMN, 132, 56, -0.025) } };
}

export function Card(p: CardProps) {
  const o = OCCASIONS[p.occasion];
  const frame = p.frame ?? "none";
  const [mt, mr, mb, ml] = FRAMES[frame];
  const s = (p.width ?? W) / W; // root px per card px
  const [CW, CH] = [W + ml + mr, H + mt + mb];
  const px = (v: number) => Math.round(v * s * 100) / 100;
  const shop = p.shopName ?? FOLDLINE.name;
  const shopSize = fitSize(shop, "fraunces-600", 400, 36, 24);
  const words = layoutWords(p, o);
  const flap = isDark(o.ground) ? mix(o.ground, "#FFFFFF", 0.24) : mix(o.ground, INK, 0.15);
  const art = COMPOSE[p.occasion](o);
  const shadow = (i: number) =>
    frame === "drop" ? outline(ml + i, mt + 8 + i * 4, W - 2 * i, H - i, R + i * 2) : outline(ml + i * 2, mt + 8 + i * 4, W - i, H - i, R + i * 2);

  return (
    <Layer style={{ width: px(CW), height: px(CH) }}>
      {/* the card's soft shadow: semi-transparent ink, so it vanishes on dark grounds and in dark mode */}
      <Svg width={px(CW)} height={px(CH)} viewBox={`0 0 ${CW} ${CH}`} title="">
        {frame === "none" ? [] : [0, 1, 2, 3, 4].map((i) => <Path key={i} d={shadow(i)} style={{ fill: INK, opacity: 0.05 }} />)}
      </Svg>
      {/* the card: its ground, the art clipped to its rounded edge (it bleeds off the right and bottom), the fold */}
      <Column style={{ width: px(CW), height: px(CH), padding: [px(mt), px(mr), px(mb), px(ml)] }}>
        <Column style={{ width: px(W), height: px(H), borderRadius: px(R), overflow: "hidden" }}>
          <Svg width={px(W)} height={px(H)} viewBox={`0 0 ${W} ${H}`} title={`${o.greet}: a ${shop} gift card for ${p.to}`}>
            <Path d={outline(0, 0, W, H, R)} style={{ fill: o.ground }} />
            {drawShapes(art, { dx: 9, dy: 11, color: mix(o.ground, INK, o.shadow) })}
            {drawShapes(art)}
            <Polygon points={points([FA, FB, FLAP].map(([x, y]) => [x - 9, y + 9] as P))} style={{ fill: INK, opacity: 0.22 }} />
            <Polygon points={points([FA, FB, FLAP])} style={{ fill: flap }} />
            <Line x1={FA[0]} y1={FA[1]} x2={FB[0]} y2={FB[1]} style={{ stroke: INK, strokeWidth: 1.5, opacity: 0.35 }} />
          </Svg>
        </Column>
      </Column>
      {/* the words */}
      <Column style={{ width: px(CW), height: px(CH), padding: [px(mt + 44), px(mr + 52), px(mb + 40), px(ml + 52)], justifyContent: "space-between", color: o.ink }}>
        <Column style={{ gap: px(10) }}>
          <Row style={{ gap: px(12), alignItems: "center" }}>
            {/* the folded mark is Foldline's: another shop's wordmark stands alone */}
            {shop === FOLDLINE.name && <Mark color={o.ink} fold={mix(o.ink, o.ground, 0.55)} size={px(30)} />}
            <Text style={{ flex: "none", fontFamily: "Fraunces", fontSize: px(shopSize), fontWeight: 600, letterSpacing: px(-0.5), lineHeight: 1 }}>
              <Lines lines={[shop]} weight={600} />
            </Text>
          </Row>
          <Text style={{ fontFamily: "Red Hat Mono", fontSize: px(20), fontWeight: 600, letterSpacing: px(4), textTransform: "uppercase" }}>Gift card</Text>
        </Column>
        {words.hidden ? (
          <Column style={{ width: px(CARD_COLUMN) }}>
            <Text style={{ ...greet, fontSize: px(words.lead.size), lineHeight: 1.04 }}><Lines lines={words.lead.lines} /></Text>
            <Text style={{ ...greet, fontSize: px(words.name.size), lineHeight: 1.04 }}><Lines lines={words.name.lines} /></Text>
          </Column>
        ) : (
          <Column style={{ gap: px(6), width: px(CARD_COLUMN) }}>
            <Text style={{ ...greet, fontSize: px(words.greeting.size), lineHeight: 1.1 }}><Lines lines={words.greeting.lines} /></Text>
            <Text style={{ fontFamily: "Fraunces", fontSize: px(words.amount.size), fontWeight: 700, lineHeight: 1.04, letterSpacing: px(-words.amount.size * 0.025) }}>
              <Lines lines={[words.amount.text]} weight={700} />
            </Text>
          </Column>
        )}
      </Column>
    </Layer>
  );
}
