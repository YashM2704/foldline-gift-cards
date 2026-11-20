/**
 * Renders gifts: each JSON file in gifts/ (or the ones named) becomes out/<gift>/, its whole set (see outputs.ts):
 * the card face in three frames, two share images, the email (HTML and text), the balance page and the PDF.
 *
 *   npm run render                      every gift
 *   npm run render -- priya-birthday    one gift
 *
 * Each gift is checked first: the rules a shop can read (a name too long for the card, an emoji…), then every
 * template's own check() of every format. Nothing is written for a gift that fails; the run exits 1.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { formatDiagnostics, type Diagnostic } from "@hyper-elements/react";
import { loadFonts } from "../src/fonts";
import { draw, plan, type Values } from "./outputs";

/**
 * Writes a file, or stops with a sentence when it can't: on Windows a PDF or an image left open in another program
 * is locked, and the raw EBUSY says nothing useful.
 */
async function write(path: string, data: string | Uint8Array) {
  try {
    await writeFile(path, data);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EBUSY" || code === "EPERM" || code === "UNKNOWN") {
      console.log(`
Couldn't write ${path}: it's open in another program (a PDF reader or an image viewer?). Close it and run again.`);
      process.exit(1);
    }
    throw e;
  }
}

const all = (await readdir("gifts")).filter((f) => f.endsWith(".json")).map((f) => basename(f, ".json"));
const asked = process.argv.slice(2).map((a) => basename(a, ".json"));
const unknown = asked.filter((g) => !all.includes(g));
if (unknown.length) {
  console.log(`No gift called ${unknown.map((g) => `“${g}”`).join(", ")} in gifts/. The gifts are: ${all.join(", ")}.`);
  process.exit(1);
}
const gifts = asked.length ? asked : all;
const fonts = await loadFonts().catch((e: Error) => {
  console.log(e.message);
  process.exit(1);
});
const failed: string[] = [];
const warnings = (d: Diagnostic[]) => d.filter((x) => x.severity !== "info");

for (const gift of gifts) {
  const values: Values = JSON.parse(await readFile(join("gifts", `${gift}.json`), "utf8"));
  const { ready, found, invalid, jobs } = plan(values);
  if (!ready) {
    failed.push(gift);
    console.log(`✗ ${gift}`);
    for (const p of found) console.log(`    ${p.field}: ${p.message}`);
    if (!found.length) for (const j of invalid) console.log(`    ${j.file}:\n${formatDiagnostics(j.checked.diagnostics)}`);
    continue;
  }
  const dir = join("out", gift);
  await mkdir(dir, { recursive: true });
  const written = await draw(jobs, dir, fonts, write);
  for (const w of written) if (warnings(w.diagnostics).length) console.log(`    ${w.file}:\n${formatDiagnostics(warnings(w.diagnostics))}`);
  console.log(`✓ ${gift.padEnd(20)} ${written.length} files`);
}
if (failed.length) {
  console.log(`\n${failed.length} of ${gifts.length} gifts failed: ${failed.join(", ")}`);
  process.exitCode = 1;
}
