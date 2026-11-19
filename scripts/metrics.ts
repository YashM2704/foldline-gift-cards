/**
 * Writes src/metrics.json: each face's glyph advance widths in em, read once from the very font files the
 * renderers draw with. text.ts measures with it, synchronously, on every output. Run after changing a font.
 */
import { writeFile } from "node:fs/promises";
import opentype from "opentype.js";
import { loadFonts } from "../src/fonts";

const FACES: Record<string, [family: string, weight: number, style: string]> = {
  "fraunces-700": ["Fraunces", 700, "normal"],
  "fraunces-600": ["Fraunces", 600, "normal"],
  "fraunces-400i": ["Fraunces", 400, "italic"],
  "sans-400": ["Instrument Sans", 400, "normal"],
  "sans-700": ["Instrument Sans", 700, "normal"],
  "martel-700": ["Martel", 700, "normal"],
  "martel-400": ["Martel", 400, "normal"],
  "mono-600": ["Red Hat Mono", 600, "normal"],
};
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i));
const CHARS = [
  ...range(0x20, 0x7e), ...range(0xa0, 0x17f), ...range(0x218, 0x21b), ...range(0x900, 0x97f),
  ..."‐‑‒–—‘’“”…€₹ ",
];

const fonts = await loadFonts();
const table: Record<string, { widths: Record<string, number> }> = {};
for (const [name, [family, weight, style]] of Object.entries(FACES)) {
  const file = fonts.find((f) => f.family === family && f.weight === weight && f.style === style);
  if (!file) throw new Error(`No font file for ${family} ${weight} ${style}`);
  const font = opentype.parse(file.src.buffer.slice(file.src.byteOffset, file.src.byteOffset + file.src.byteLength));
  const widths: Record<string, number> = {};
  for (const ch of CHARS) {
    const glyph = font.charToGlyph(ch);
    if (glyph && glyph.index !== 0) widths[ch] = Math.round((glyph.advanceWidth! / font.unitsPerEm) * 10000) / 10000;
  }
  table[name] = { widths };
  console.log(`${name.padEnd(14)} ${String(Object.keys(widths).length).padStart(3)} glyphs`);
}
await writeFile("src/metrics.json", JSON.stringify(table));
console.log("wrote src/metrics.json");
