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
