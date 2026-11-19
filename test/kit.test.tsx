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
