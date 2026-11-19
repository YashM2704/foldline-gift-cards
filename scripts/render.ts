/**
 * Renders gifts: each JSON file in gifts/ (or the ones named) becomes out/<gift>/, one file per template and format.
 *
 *   npm run render                      every gift
 *   npm run render -- priya-birthday    one gift
 *
 * Each gift is checked first: the rules a shop can read (a name too long for the card, an emoji…), then every
 * template's own check() of the values. Nothing is written for a gift that fails; the run exits 1.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { formatDiagnostics } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import type { Template } from "@hyper-elements/react/template";
import { problems } from "../src/fields";
import { loadFonts } from "../src/fonts";
import cardImage from "../src/templates/card-image";

/** What the kit renders for every gift: a template, its formats, and how each becomes a file. */
const OUTPUTS: Array<{ name: string; template: Template<any, any>; formats: string[]; kind: "png" }> = [
  { name: "card", template: cardImage, formats: ["even", "flush", "drop"], kind: "png" },
];

const all = (await readdir("gifts")).filter((f) => f.endsWith(".json")).map((f) => basename(f, ".json"));
const asked = process.argv.slice(2).map((a) => basename(a, ".json"));
const unknown = asked.filter((g) => !all.includes(g));
if (unknown.length) {
  console.log(`No gift called ${unknown.map((g) => `“${g}”`).join(", ")} in gifts/. The gifts are: ${all.join(", ")}.`);
  process.exit(1);
}
const gifts = asked.length ? asked : all;
const fonts = await loadFonts();
const failed: string[] = [];

for (const gift of gifts) {
  const values = JSON.parse(await readFile(join("gifts", `${gift}.json`), "utf8"));
  // the rules a shop can read first, then every template's own check of every format: all of it before any file
  const found = problems(values);
  const checks = OUTPUTS.flatMap((out) => out.formats.map((format) => ({ out, format, checked: out.template.check(values, { format }) })));
  const invalid = checks.filter(({ checked, format }) => !checked.valid || !(checked.snapshots as Record<string, unknown>)[format]);
  if (found.length || invalid.length) {
    failed.push(gift);
    console.log(`✗ ${gift}`);
    for (const p of found) console.log(`    ${p.field}: ${p.message}`);
    if (!found.length) for (const { out, format, checked } of invalid) console.log(`    ${out.name} (${format}):\n${formatDiagnostics(checked.diagnostics)}`);
    continue;
  }
  const dir = join("out", gift);
  await mkdir(dir, { recursive: true });
  const written: string[] = [];
  for (const { out, format, checked } of checks) {
    const snapshot = (checked.snapshots as Record<string, unknown>)[format];
    const { image, diagnostics } = await renderImage(snapshot as never, { fonts, strict: true });
    await writeFile(join(dir, `${out.name}-${format}.png`), image);
    written.push(`${out.name}-${format}.png`);
    if (diagnostics.length) console.log(formatDiagnostics(diagnostics));
  }
  console.log(`✓ ${gift.padEnd(20)} ${written.join(" · ")}`);
}
if (failed.length) {
  console.log(`\n${failed.length} of ${gifts.length} gifts failed: ${failed.join(", ")}`);
  process.exitCode = 1;
}
