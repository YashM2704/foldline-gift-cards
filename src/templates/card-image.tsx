/**
 * Foldline gift card — the card face as an image: what the email shows, and the card on its own.
 *
 * Three formats, by where the image goes: `even` (shadow all round, the card on its own), `flush` (no shadow room
 * left or top) and `drop` (shadow straight down, the image exactly the card's width: the email embeds this one, so
 * the card lines up with the column on both edges).
 */
import { Canvas } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { OCCASIONS } from "../brand";
import { assertPrintable, example, fields } from "../fields";
import { FONTS } from "../fonts";
import { Card, frameSize, type Frame } from "../parts/Card";

const formats = {
  even: frameSize("even"),
  flush: frameSize("flush"),
  drop: frameSize("drop"),
} satisfies Record<Exclude<Frame, "none">, { width: number; height: number }>;

export default template({
  id: "foldline.GiftCardImage",
  version: "1.0.0",
  label: "Gift card image",
  description: "The gift card's face as a PNG: origami art for the occasion, the greeting, the amount, a folded corner.",
  guidance: "One card per gift. The amount is fitted to the card; names must fit it on a line of their own.",
  root: "Canvas",
  formats,
  fields,
  example,
  // what only measuring decides: nothing past the image, and a font for every character
  rules: { require: { core: ["image/overflow", "image/glyph"] } },
  render(v, { format }) {
    assertPrintable(v);
    const size = formats[format];
    return (
      <Canvas width={size.width} height={size.height} fonts={FONTS} lang={v.locale} title={`${OCCASIONS[v.occasion].greet}, ${v.to}`} style={{ backgroundColor: "transparent", fontFamily: "Instrument Sans" }}>
        <Card {...v} frame={format} />
      </Canvas>
    );
  },
});
