/**
 * Foldline gift card — share images: "A gift from Arjun", the card, and the note, for WhatsApp and Instagram,
 * where most gifts actually get announced. Square (1080²) and story (1080 × 1920, everything inside Instagram's
 * safe area).
 *
 * Every line is measured and set by the template; the column (headline, card, note, footer) is as wide as the card
 * and centred. A note is never cut: one that can't fit even beside the smallest card is refused before anything
 * is drawn.
 */
import { Canvas, Column, Layer, Line, Polygon, Row, Svg, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { isDark, mix } from "../art/shapes";
import { INK, OCCASIONS, PAPER, WHITE } from "../brand";
import { assertPrintable, example, fields } from "../fields";
import { FONTS } from "../fonts";
import { shopOf } from "../format";
import { Card, H, W } from "../parts/Card";
import { Mark } from "../parts/Mark";
import { fitSize, fitWrapped, Lines, measure, preferNoWidow, smart, steps } from "../text";

const FORMAT = {
  // square: the stack centred; story: spread over Instagram's safe area (its UI covers the top 250px and bottom 340px)
  square: { width: 1080, height: 1080, pad: 72, top: 72, bottom: 72, head: [72, 56], lead: 40, note: [44, 36, 28], notePad: 36, from: 26, foot: 24, justify: "center" },
  story: { width: 1080, height: 1920, pad: 80, top: 280, bottom: 380, head: [96, 64], lead: 48, note: [56, 40, 28], notePad: 52, from: 30, foot: 30, justify: "space-between" },
} as const;
type Format = keyof typeof FORMAT;
const GAP = 36, LEADING = 1.35, DROP = 34;

/** "A gift from {from}": one line from the format's largest size down to its floor; else a lead-in line, then the
 *  name on its own line, fitted down to 28px. Null if even that won't fit the column. */
function headline(from: string, width: number, f: (typeof FORMAT)[Format]) {
  const one = `A gift from ${from}`;
  const [max, min] = f.head;
  if (measure(one, "fraunces-700", min) <= width) {
    const size = fitSize(one, "fraunces-700", width, max, min);
    return { lines: [one], sizes: [size], height: size * 1.08 };
  }
  if (measure(from, "fraunces-700", 28) > width) return null;
  const nameSize = fitSize(from, "fraunces-700", width, max, 28);
  return { lines: ["A gift from", from], sizes: [f.lead, nameSize], height: (f.lead + nameSize) * 1.08 };
}

/**
 * The layout, by measuring. The column — headline, card, note sheet, footer — is as wide as the card, and centred,
 * so every edge lines up. The note keeps a comfortable size (36px on the square, 40px on the story) while the card
 * shrinks to 70% of the width; only below that does it go down to 28px. Null when it can't fit even then: refused,
 * never cut.
 */
export function layout(v: { from: string; message?: string }, format: Format) {
  const f = FORMAT[format];
  const full = f.width - 2 * f.pad;
  const message = v.message ? smart(v.message) : "";
  const [largest, comfortable, smallest] = f.note;
  // 1 and 2: one column, as wide as the card. 3, for long notes only: the sheet keeps the full width and only
  // the card shrinks, so a note the rules accept always fits.
  const passes = [
    { shares: [1, 0.9, 0.8, 0.75, 0.7], sizes: steps(largest, comfortable), fullSheet: false },
    { shares: [0.65, 0.6, 0.55, 0.5], sizes: steps(largest, smallest), fullSheet: false },
    { shares: [0.8, 0.7, 0.6, 0.5], sizes: steps(largest, smallest), fullSheet: true },
  ];
  const fromH = f.from * 1.5;
  const NOTE_PAD = f.notePad;
  for (const pass of passes) {
    for (const share of pass.shares) {
      const cardW = 2 * Math.round((full * share) / 2); // even, so the margins either side are whole pixels
      const width = pass.fullSheet ? full : cardW;
      const head = headline(v.from, width, f);
      if (!head) continue;
      const cardH = ((H + DROP) * cardW) / W;
      const room = f.height - f.top - f.bottom - head.height - f.foot * 1.4 - GAP * (message ? 3 : 2) - cardH;
      const base = { f, width, cardW, left: Math.round((f.width - width) / 2), head };
      if (!message) {
        if (room >= 0) return { ...base, note: null };
        continue;
      }
      // the largest size that fits beside a card this size, preferring one that leaves no widow
      const fit = preferNoWidow(
        pass.sizes.map((size) => {
          const maxLines = Math.floor((room - 2 * NOTE_PAD - fromH) / (size * LEADING));
          return maxLines > 0 ? fitWrapped(message, "fraunces-400i", width - 2 * NOTE_PAD, [size], maxLines) : null;
        }),
      );
      if (fit) return { ...base, note: { size: fit.size, lines: fit.lines, height: Math.ceil(2 * NOTE_PAD + fromH + fit.lines.length * fit.size * LEADING) } };
    }
  }
  return null;
}

/** The note: a sheet of paper with its corner folded, as the card's is. */
function Note({ width, height, size, lines, from, fromSize, pad, background }: { width: number; height: number; size: number; lines: string[]; from: string; fromSize: number; pad: number; background: string }) {
  const F = 36;
  return (
    <Layer style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} title="">
        <Polygon points={`0,0 ${width - F},0 ${width},${F} ${width},${height} 0,${height}`} style={{ fill: background }} />
        <Polygon points={`${width - F - 5},5 ${width - 5},${F + 5} ${width - F - 5},${F + 5}`} style={{ fill: INK, opacity: 0.14 }} />
        <Polygon points={`${width - F},0 ${width},${F} ${width - F},${F}`} style={{ fill: mix(background, INK, 0.1) }} />
        <Line x1={width - F} y1={0} x2={width} y2={F} style={{ stroke: INK, strokeWidth: 1, opacity: 0.3 }} />
      </Svg>
      <Column style={{ width, height, padding: pad, gap: 10, color: INK }}>
        <Text style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: size, lineHeight: LEADING }}><Lines lines={lines} /></Text>
        <Text style={{ fontSize: fromSize, fontWeight: 500 }}><Lines lines={[`— ${from}`]} family="Instrument Sans" /></Text>
      </Column>
    </Layer>
  );
}

/** For galleries and tools that list designs, as the official gallery's files do. */
export const meta = {
  title: "Foldline gift card share image",
  description: "“A gift from Arjun”: the card and the note as a square or story image, every line measured and fitted.",
  root: "Canvas",
};

export default template({
  id: "foldline.GiftShare",
  version: "1.0.0",
  label: "Gift card share image",
  description: "“A gift from Arjun”: the card and the note as an image for WhatsApp and Instagram, square or story.",
  guidance: "For the recipient (or the sender) to post. With showAmount off the card shows no value.",
  root: "Canvas",
  formats: { square: { width: 1080, height: 1080 }, story: { width: 1080, height: 1920 } },
  fields,
  example,
  rules: { require: { core: ["image/overflow", "image/glyph"] } },
  render(v, { format }) {
    assertPrintable(v);
    const L = layout(v, format);
    if (!L) throw new Error("message: That note is too long for the share image: shorten it a little, or share without it.");
    const o = OCCASIONS[v.occasion];
    const shop = shopOf(v);
    // a contrasting ground, so the card's edge reads: its text colour under a light card, paper under a dark one
    const ground = isDark(o.ground) ? PAPER : o.ink;
    const text = isDark(ground) ? PAPER : INK;
    return (
      <Canvas width={L.f.width} height={L.f.height} fonts={FONTS} lang="en" title={`A gift from ${v.from}`}
        style={{ backgroundColor: ground, padding: [L.f.top, L.left, L.f.bottom, L.left], gap: GAP, justifyContent: L.f.justify, fontFamily: "Instrument Sans", color: text }}>
        <Column>
          {L.head.lines.map((line, i) => (
            <Text key={i} style={{ fontFamily: "Fraunces", fontWeight: 700, fontSize: L.head.sizes[i], lineHeight: 1.08 }}><Lines lines={[line]} weight={700} /></Text>
          ))}
        </Column>
        {/* the card's shadow room sits under it, so the gap below it is that much less: the gaps look even */}
        <Column style={{ gap: Math.max(8, GAP - Math.round((DROP * L.cardW) / W)) }}>
          <Card {...v} frame="drop" width={L.cardW} />
          {L.note && <Note width={L.width} height={L.note.height} size={L.note.size} lines={L.note.lines} from={v.from} fromSize={L.f.from} pad={L.f.notePad} background={ground === PAPER ? WHITE : PAPER} />}
        </Column>
        <Row style={{ gap: 12, alignItems: "center" }}>
          {shop.isFoldline && <Mark color={text} fold={mix(text, ground, 0.5)} size={L.f.foot + 4} />}
          <Text style={{ flex: "none", fontSize: L.f.foot, fontWeight: 500 }}><Lines lines={[shop.name]} family="Instrument Sans" /></Text>
          <Text style={{ flex: "none", fontSize: L.f.foot, fontWeight: 500, color: mix(text, ground, 0.45) }}>·</Text>
          <Text style={{ flex: "none", fontSize: L.f.foot, fontWeight: 500 }}>{shop.host}</Text>
        </Row>
      </Canvas>
    );
  },
});
