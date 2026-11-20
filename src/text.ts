/**
 * Text, measured. Every size and line break on the card, the PDF and the share images is decided here from the
 * fonts' own glyph widths (metrics.json, written by `npm run metrics` from the very files the renderers draw with),
 * synchronously, so a template's render can use it on every root.
 *
 * On images and PDFs the template sets every line break itself and draws lines as measured: a renderer left to
 * wrap would break where a font changes. Emails and pages are HTML, and browsers wrap them.
 */
import { createElement, Fragment, type ReactNode } from "react";
import { LineBreak, Span } from "@hyper-elements/react";
import METRICS from "./metrics.json" with { type: "json" };

export type Face = keyof typeof METRICS;
const DEVA = /[ऀ-ॿ‌‍]/;

// ---------- what can be printed ----------

/** Latin, Latin-1, Latin Extended-A (and Romanian ș ț), Devanagari and typographic punctuation: what the fonts draw. */
const CHARS = "\\n\\u0020-\\u007E\\u00A0-\\u017F\\u0218-\\u021B\\u0900-\\u097F\\u200C\\u200D\\u2010-\\u2014\\u2018\\u2019\\u201C\\u201D\\u2026";
/** As a field's `pattern` (a regular expression's source, matched with `u`), for tools that fill the template. */
export const PRINTABLE = `^[${CHARS}]*$`;
const PRINTABLE_CHAR = new RegExp(`^[${CHARS}]$`, "u");

/** Why text can't be printed, as a sentence a shop can show; null when every character can be drawn. */
export function unprintable(text: string): string | null {
  const bad = [...text].find((ch) => !PRINTABLE_CHAR.test(ch));
  if (!bad) return null;
  return /\p{Extended_Pictographic}/u.test(bad)
    ? `“${bad}” is an emoji: printed cards and images can't draw emoji, so please leave it out.`
    : `“${bad}” can't be printed: use Latin or Devanagari letters.`;
}

// ---------- measuring ----------

const widths = (face: Face) => METRICS[face].widths as Record<string, number>;
const devaFace = (face: Face): Face => (face === "fraunces-700" || face === "fraunces-600" ? "martel-700" : "martel-400");

/** The width of text in px from the fonts' advance widths, with a 4% margin for kerning and rounding. */
export function measure(text: string, face: Face, size: number, letterSpacing = 0): number {
  let em = 0;
  for (const ch of text) {
    const table = DEVA.test(ch) || (ch === "₹" && !(ch in widths(face))) ? widths(devaFace(face)) : widths(face);
    em += table[ch] ?? 0.62;
  }
  return (em * size + letterSpacing * Math.max(0, [...text].length - 1)) * 1.04;
}

/** The largest size from max down to min at which text fits width (min if none does). `tracking` is letter-spacing
 *  in em, so it scales with the size; measured the same way measure() measures it. */
export const fitSize = (text: string, face: Face, width: number, max: number, min: number, tracking = 0) =>
  Math.max(min, Math.min(max, Math.floor(width / measure(text, face, 1, tracking))));

/** Sizes from `from` down to `to`, every `by`. */
export const steps = (from: number, to: number, by = 2) => Array.from({ length: Math.floor((from - to) / by) + 1 }, (_, i) => from - i * by);

/**
 * Word wrap with the real widths. Breaks fall only at spaces, and after a hyphen when a word alone is too wide.
 * A one-letter word (Polish "w", "z", Czech "v", English "a") stays with the word after it, as typesetters keep it.
 */
export function wrap(text: string, face: Face, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words: string[] = [];
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const prev = words[words.length - 1];
      if (prev !== undefined && [...prev].length === 1 && /\p{L}/u.test(prev)) words[words.length - 1] = `${prev} ${w}`;
      else words.push(w);
    }
    const pieces = words.flatMap((w) => (measure(w, face, size) > width ? w.split(/(?<=-)/) : [w]));
    let line = "";
    for (const piece of pieces) {
      const next = line + (line === "" || line.endsWith("-") ? "" : " ") + piece;
      if (line && measure(next, face, size) > width) {
        lines.push(line);
        line = piece;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** A widow: one word alone on the last line of a paragraph of several. */
export const isWidow = (lines: string[]) => lines.length > 1 && !/\s/.test(lines[lines.length - 1].trim());

/**
 * The largest size in `sizes` at which text wraps into at most maxLines with every line fitting; null if none.
 * It prefers a size that leaves no widow; only if every size would is one taken.
 */
export function fitWrapped(text: string, face: Face, width: number, sizes: number[], maxLines: number) {
  let fallback: { size: number; lines: string[] } | null = null;
  for (const size of sizes) {
    const lines = wrap(text, face, size, width);
    if (lines.length > maxLines || lines.some((l) => measure(l, face, size) > width)) continue;
    if (!isWidow(lines)) return { size, lines };
    fallback ??= { size, lines };
  }
  return fallback;
}

/** The first of several measured layouts that leaves no widow, else the first of them; null if there are none. */
export const preferNoWidow = <T extends { lines: string[] }>(layouts: Array<T | null>): T | null =>
  layouts.find((l): l is T => !!l && !isWidow(l.lines)) ?? layouts.find((l): l is T => !!l) ?? null;

// ---------- the rules a value must meet ----------

/** The card's text column, and the smallest the greeting goes when it breaks after the comma. */
export const CARD_COLUMN = 480;
export const NAME_FLOOR = 28;

/**
 * A name — the recipient's and the sender's alike — must fit the card's text column on a line of its own at the
 * smallest greeting size. Every other place a name appears is sized against this rule: the PDF cover's line
 * (450px at 4 px/mm) floors at 26px, where any accepted name is ≤ 446px; the share headline's name line floors at
 * 40px upright, ≤ 860px in a 920px column.
 */
export function nameProblem(name: string): string | null {
  if (measure(name, "fraunces-400i", NAME_FLOOR) > CARD_COLUMN) return `“${name}” is too long to fit on the card: try a shorter form of the name.`;
  return unprintable(name);
}

/** A shop name must fit the wordmark's 400px at 24px. */
export function shopProblem(shop: string): string | null {
  if (measure(shop, "fraunces-600", 24) > 400) return `“${shop}” is too long for the wordmark: use a shorter name.`;
  return unprintable(shop);
}

// ---------- typesetting ----------

/** Typographic quotes, as a typesetter would set them: it's → it’s, "gift" → “gift”. */
export const smart = (t: string) =>
  t.replace(/(^|[\s([{“])"/g, "$1“").replace(/"/g, "”").replace(/(^|[\s([{‘])'/g, "$1‘").replace(/'/g, "’");

/** Money as the locale writes it, with no decimals. */
export const money = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

/**
 * Text split into runs only where the script changes, which is always at a word: Devanagari is set in Martel,
 * upright (it has no italic). ₹ goes to Martel only inside a family without it (Instrument Sans).
 */
export function Runs({ text, family = "Fraunces", weight = 400 }: { text: string; family?: string; weight?: number }): ReactNode {
  const parts = text.split(family === "Fraunces" ? /([ऀ-ॿ‌‍]+)/ : /([ऀ-ॿ‌‍]+|₹)/).filter(Boolean);
  if (parts.length === 1) return text;
  return parts.map((raw, i) => {
    // a space at the edge of a run is dropped where two runs meet: keep it as a no-break space
    const part = raw.replace(/^ | $/g, " ");
    return DEVA.test(part) || part === "₹"
      ? createElement(Span, { key: i, style: { fontFamily: "Martel", fontStyle: "normal", fontWeight: weight >= 600 ? 700 : 400 } }, part)
      : part;
  });
}

/** Measured lines, drawn as measured: each line's runs, a LineBreak between lines, nothing left to wrap. */
export function Lines({ lines, family, weight }: { lines: string[]; family?: string; weight?: number }): ReactNode {
  return lines.map((line, i) => createElement(Fragment, { key: i }, i > 0 ? createElement(LineBreak) : null, createElement(Runs, { text: line, family, weight })));
}
