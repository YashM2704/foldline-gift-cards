/**
 * The kit's tests: the card renders on every root, the rules refuse what they should (and only that), and every
 * measured layout fits at the extremes. Run with `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Canvas, Column, Document, Page, render } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import { renderPdf } from "@hyper-elements/react/pdf";
import { example, problems } from "../src/fields";
import { FONTS, loadFonts } from "../src/fonts";
import { Card, layoutWords } from "../src/parts/Card";
import { OCCASIONS, OCCASIONS_LIST } from "../src/brand";
import { CARD_COLUMN, measure, money, nameProblem, wrap } from "../src/text";
import cardImage from "../src/templates/card-image";

const fonts = await loadFonts();
const errors = (d: Array<{ severity: string; code: string }>) => d.filter((x) => x.severity === "error").map((x) => x.code);
const gift = { occasion: "birthday" as const, amount: 2500, currency: "INR", locale: "en-IN", to: "Priya" };

test("the card renders in a Canvas, a Page and a Document, every occasion", async () => {
  for (const occasion of OCCASIONS_LIST) {
    const card = <Card {...gift} occasion={occasion} width={400} />;
    const png = await renderImage(<Canvas width={400} height={252} fonts={FONTS}>{card}</Canvas>, { fonts, strict: true });
    assert.deepEqual(errors(png.diagnostics), [], `${occasion} canvas`);
    assert.equal(png.width, 400);
    const page = await render(<Page title="t" fonts={FONTS}><Column style={{ padding: 24 }}>{card}</Column></Page>);
    assert.deepEqual(errors(page.diagnostics), [], `${occasion} page`);
    assert.match(page.html, /<svg/);
    const pdf = await renderPdf(<Document size="A4" orientation="landscape" margin={40} fonts={FONTS}>{card}</Document>, { fonts });
    assert.deepEqual(errors(pdf.diagnostics), [], `${occasion} pdf`);
    assert.equal(new TextDecoder().decode(pdf.pdf.slice(0, 5)), "%PDF-");
  }
});

test("the card-image template checks its example in every format", () => {
  for (const format of ["even", "flush", "drop"] as const) {
    const r = cardImage.check(example, { format });
    assert.equal(r.valid, true, `${format}: ${r.diagnostics.map((d) => d.message).join("; ")}`);
  }
});

test("names: too wide for the card is refused; long real names and other scripts are accepted", () => {
  for (const ok of ["Priya", "Anastasia Papadopoulou-Whitfield", "MAXIMILIAN WOJCIECHOWSKI", "Łukasz Dvořák", "Şükrü Gülşen", "Ștefan Țăranu", "प्रिया"]) assert.equal(nameProblem(ok), null, ok);
  for (const bad of ["MAXIMILIAN WOJCIECHOWSKI-MONTAGU", "W".repeat(32)]) assert.match(nameProblem(bad) ?? "", /too long to fit on the card/, bad);
  assert.match(nameProblem("Привет") ?? "", /can't be printed/);
});

test("messages and shops: emoji refused with a sentence, a long shop name refused, balance above amount refused", () => {
  const found = problems({ message: "Happy birthday! 🎉", shopName: "The Extremely Long Name of a Paper Shop Ltd", balance: 3000, amount: 2500 });
  assert.deepEqual(found.map((p) => p.field), ["message", "shopName", "balance"]);
  assert.match(found[0].message, /emoji/);
  assert.deepEqual(problems({ message: "Zażółć gęślą jaźń — wiem, że to lubisz.", to: "Łukasz", from: "Ania" }), []);
});

test("the template refuses a malformed gift code and an unknown occasion", () => {
  assert.equal(cardImage.check({ ...example, code: "K7QP-2M9X-4TRO" }, { format: "even" }).valid, false); // O isn't in the alphabet
  assert.equal(cardImage.check({ ...example, occasion: "wedding" }, { format: "even" }).valid, false);
});

test("the largest amount fits the card's column in every locale", () => {
  for (const [currency, locale] of [["INR", "en-IN"], ["USD", "en-US"], ["GBP", "en-GB"], ["EUR", "de-DE"]]) {
    const w = layoutWords({ ...gift, amount: 100000, currency, locale }, OCCASIONS.birthday);
    assert.equal(w.hidden, false);
    if (!w.hidden) assert.ok(measure(w.amount.text, "fraunces-700", w.amount.size, -w.amount.size * 0.025) <= CARD_COLUMN, `${money(100000, currency, locale)} at ${w.amount.size}px`);
  }
});

test("wrapping breaks only at spaces and after hyphens, and keeps one-letter words with the next", () => {
  const note = "Wszystkiego najlepszego, Łukasz! Kup sobie ten zeszyt w kratkę, o którym mówiłeś od miesięcy.";
  const lines = wrap(note, "fraunces-400i", 30, 480);
  assert.equal(lines.join(" ").replace(/ /g, " "), note);
  assert.ok(!lines.some((l) => / [wzioua]$/i.test(l)), "no line ends with a one-letter word");
  assert.deepEqual(wrap("Anastasia Papadopoulou-Whitfield", "fraunces-400i", 40, 480), ["Anastasia", "Papadopoulou-Whitfield"]);
});

// ---------- the four Phase 4 templates ----------
import { render as renderHtml } from "@hyper-elements/react";
import share, { layout as shareLayout } from "../src/templates/share";
import fold from "../src/templates/fold";
import emailTemplate from "../src/templates/email";
import pageTemplate from "../src/templates/page";
import type { Template } from "@hyper-elements/react/template";

const snap = (t: Template<any, any>, v: unknown, format?: string) => {
  const r = t.check(v, format ? { format } : undefined);
  assert.equal(r.valid, true, r.diagnostics.map((d) => d.message).join("; "));
  return (r.snapshots as Record<string, unknown>)[format ?? "default"] as never;
};

test("every template checks its example in every format, and renders it without errors", async () => {
  for (const format of ["square", "story"]) assert.deepEqual(errors((await renderImage(snap(share, example, format), { fonts, strict: true })).diagnostics), []);
  for (const format of ["a4", "letter"]) {
    const pdf = await renderPdf(snap(fold, example, format), { fonts });
    assert.deepEqual(errors(pdf.diagnostics), [], format);
    assert.equal(new TextDecoder().decode(pdf.pdf.slice(0, 5)), "%PDF-");
  }
  assert.deepEqual(errors((await renderHtml(snap(emailTemplate, example))).diagnostics), []);
  assert.deepEqual(errors((await renderHtml(snap(pageTemplate, example))).diagnostics), []);
});

test("showAmount off: the email carries the value nowhere — preheader, alt text, details, plain text", async () => {
  const hidden = { ...example, amount: 2500, showAmount: false };
  const r = await renderHtml(snap(emailTemplate, hidden));
  for (const s of ["₹2,500", "2,500", "₹"]) {
    assert.ok(!r.html.includes(s), `html shows ${s}`);
    assert.ok(!r.text.includes(s), `text shows ${s}`);
  }
  assert.match(r.html, /Arjun sent you a gift card\. Your code is inside\./);
  const shown = await renderHtml(snap(emailTemplate, example));
  assert.match(shown.html, /₹2,500 Foldline gift card for Priya/);
});

test("the balance page: spent hides Redeem, expired hides the code, an empty history says so", async () => {
  const html = async (v: object) => (await renderHtml(snap(pageTemplate, { ...example, ...v }))).html;
  const spent = await html({ balance: 0 });
  assert.ok(!spent.includes("Redeem online") && spent.includes("All spent"));
  const expired = await html({ asOf: "2028-01-01" });
  assert.ok(!expired.includes(example.code) && expired.includes("Expired on 18 Nov 2027"));
  assert.match(await html({}), /No purchases yet/);
  assert.match(await html({ balance: 800 }), /₹800 left/);
});

test("share images: a note that can't fit even beside the smallest card is refused, not cut", () => {
  assert.ok(shareLayout({ from: "Arjun", message: "W".repeat(240) }, "square") === null);
  const long = "Happy birthday, Priya! I couldn't choose between the green fountain pen and the notebook with the gold edges, so now you don't have to either. Get both, or neither, or something I'd never think of. See you on Saturday for cake, I promise.";
  const l = shareLayout({ from: "Arjun", message: long }, "square");
  assert.ok(l?.note && l.note.lines.join(" ").replace(/ /g, " ") === long.replace(/'/g, "’"), "the whole note, typeset");
});

test("share images: the column is the card's width and centred, and the note stays comfortable while the card can shrink", () => {
  const l = shareLayout({ from: "Meera", message: "Light every lamp this year. Something for the new diary, with love." }, "square");
  assert.ok(l && l.note);
  assert.equal(l.left * 2 + l.width, 1080, "centred, whole pixels");
  assert.ok(l.note.size >= 36, `note at ${l.note.size}px`);
  const story = shareLayout({ from: "Arjun", message: "Happy birthday! Get yourself that fountain pen you keep looking at." }, "story");
  assert.ok(story?.note && story.note.size >= 40, "the story's note is larger");
});

test("email: with the value hidden and no balance page, it says only what's true", async () => {
  const r = await renderHtml(snap(emailTemplate, { ...example, showAmount: false, balanceUrl: undefined }));
  assert.ok(!r.html.includes("On your card"));
  assert.match(r.html, /Shown when you redeem/);
  assert.match(r.html, /card-drop\.png/, "the email embeds the drop export, which lines up with its column");
  assert.match(r.html, /lang="en"/);
});

test("the balance page: nothing spent yet says so, and a spent card offers nothing to print", async () => {
  const full = (await renderHtml(snap(pageTemplate, { ...example, balance: 2500 }))).html;
  assert.match(full, /Nothing spent yet/);
  assert.ok(!full.includes("of ₹2,500"));
  const spent = (await renderHtml(snap(pageTemplate, { ...example, balance: 0 }))).html;
  assert.ok(!spent.includes("Print it as a card"));
});

// ---------- the edge-case matrix: hard gifts through every template, every format ----------
import cardImageT from "../src/templates/card-image";
import { problems as giftProblems } from "../src/fields";

const LONG_NOTE = "Happy birthday, Priya! I couldn't choose between the green fountain pen and the notebook with the gold edges, so now you don't have to either. Get both, or neither, or something I'd never think of. See you on Saturday for cake, I promise.";
const MATRIX: Array<[string, Record<string, unknown>]> = [
  ["birthday, ₹ max, long names", { occasion: "birthday", amount: 100000, currency: "INR", locale: "en-IN", to: "Anastasia Papadopoulou-Whitfield", from: "MAXIMILIAN WOJCIECHOWSKI" }],
  ["thanks, £ max, value hidden", { occasion: "thanks", amount: 100000, currency: "GBP", locale: "en-GB", showAmount: false }],
  ["festive, € max (de-DE), long note", { occasion: "festive", amount: 100000, currency: "EUR", locale: "de-DE", message: LONG_NOTE }],
  ["congrats, $ max (Letter), no note", { occasion: "congrats", amount: 100000, currency: "USD", locale: "en-US", message: undefined }],
  ["justBecause, Hindi names and note", { occasion: "justBecause", to: "प्रिया", from: "अर्जुन", message: "जन्मदिन मुबारक! Get yourself that pen." }],
  ["birthday, Polish note, hidden", { occasion: "birthday", currency: "EUR", locale: "de-DE", to: "Łukasz", from: "Ania", message: "Wszystkiego najlepszego! Kup sobie ten zeszyt w kratkę, o którym mówiłeś od miesięcy.", showAmount: false }],
  ["thanks, Turkish and Romanian", { occasion: "thanks", to: "Şükrü Gülşen", from: "Ștefan Țăranu", currency: "EUR", locale: "en-GB" }],
  ["festive, spent, 20 history rows", { occasion: "festive", balance: 0, history: Array.from({ length: 20 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, label: `Order #${1000 + i}`, amount: -125 })) }],
  ["congrats, expired, in-store code", { occasion: "congrats", asOf: "2028-02-01", barcode: "FOLD-K7QP2M9X4TRA" }],
  ["justBecause, amount 1, other shop", { occasion: "justBecause", amount: 1, shopName: "Marigold Paper and Press", shopUrl: "https://marigold.example", supportEmail: "help@marigold.example" }],
  ["birthday, all caps note", { occasion: "birthday", message: "HAPPY BIRTHDAY! I COULDN'T CHOOSE BETWEEN THE GREEN FOUNTAIN PEN AND THE NOTEBOOK WITH THE GOLD EDGES, SO NOW YOU DON'T HAVE TO EITHER. SEE YOU ON SATURDAY!" }],
  ["thanks, nothing spent, no links", { occasion: "thanks", balance: 2500, balanceUrl: undefined, printUrl: undefined }],
];

test("edge-case matrix: twelve hard gifts render through every template and format without errors", async () => {
  for (const [name, patch] of MATRIX) {
    const v = { ...example, ...patch } as Record<string, unknown>;
    assert.deepEqual(giftProblems(v as never), [], `${name}: problems`);
    const pngs: Array<[Template<any, any>, string]> = [[cardImageT, "even"], [cardImageT, "flush"], [cardImageT, "drop"], [share, "square"], [share, "story"]];
    for (const [t, format] of pngs) {
      const r = await renderImage(snap(t, v, format), { fonts, strict: true });
      assert.deepEqual(errors(r.diagnostics), [], `${name}: ${t.id} ${format}`);
    }
    const pdf = await renderPdf(snap(fold, v, v.locale === "en-US" ? "letter" : "a4"), { fonts });
    assert.deepEqual(errors(pdf.diagnostics), [], `${name}: pdf`);
    for (const t of [emailTemplate, pageTemplate]) assert.deepEqual(errors((await renderHtml(snap(t, v))).diagnostics), [], `${name}: ${t.id}`);
  }
});

// ---------- accessibility: every text colour against its ground meets WCAG AA (4.5:1) ----------
import { mix as mixColour } from "../src/art/shapes";
import { INK, PAPER, QUIET, WHITE } from "../src/brand";

test("contrast: every text and ground pair the kit draws is at least 4.5:1 (WCAG AA)", () => {
  const lin = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const lum = (c: string) => { const [r, g, b] = lin(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs: Array<[string, string, string]> = [
    ["body text on paper", INK, PAPER], ["quiet text on paper", QUIET, PAPER], ["quiet labels on white", QUIET, WHITE], ["button text", PAPER, INK],
    ...OCCASIONS_LIST.map((k): [string, string, string] => [`card text, ${k}`, OCCASIONS[k].ink, OCCASIONS[k].ground]),
    ...OCCASIONS_LIST.filter((k) => lum(OCCASIONS[k].ground) >= 0.18).map((k): [string, string, string] => [`share headline on ${k}`, PAPER, OCCASIONS[k].ink]),
  ];
  for (const [name, fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${name}: ${ratio(fg, bg).toFixed(2)}:1`);
  assert.ok(ratio(mixColour(PAPER, INK, 0.45), INK) >= 3, "the share footer's dot (decorative, large-text rule)");
});
