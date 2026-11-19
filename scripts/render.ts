/**
 * Renders gifts: each JSON file in gifts/ (or the ones named) becomes out/<gift>/, its whole set:
 *
 *   card-even.png · card-flush.png · card-drop.png    the card face
 *   share-square.png · share-story.png                 to post
 *   email.html · email.txt                             the delivery email (it embeds card-drop.png)
 *   page.html                                          the balance page
 *   card.pdf                                           the printable fold-in card (Letter for en-US, else A4)
 *
 *   npm run render                      every gift
 *   npm run render -- priya-birthday    one gift
 *
 * Each gift is checked first: the rules a shop can read (a name too long for the card, an emoji…), then every
 * template's own check() of every format. Nothing is written for a gift that fails; the run exits 1.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { formatDiagnostics, render, type Diagnostic } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import { renderPdf } from "@hyper-elements/react/pdf";
import type { Template } from "@hyper-elements/react/template";
import { problems } from "../src/fields";
import { loadFonts } from "../src/fonts";
import cardImage from "../src/templates/card-image";
import email from "../src/templates/email";
import fold from "../src/templates/fold";
import page from "../src/templates/page";
import share from "../src/templates/share";

/** A gift file: untyped JSON, checked by problems() and by every template before anything is drawn. */
type Values = Record<string, any>;
interface Output {
  template: Template<any, any>;
  /** The formats to render, and each one's file name. */
  files: (v: Values) => Array<{ format?: string; file: string }>;
  kind: "png" | "pdf" | "html";
}
const OUTPUTS: Output[] = [
  { template: cardImage, kind: "png", files: () => ["even", "flush", "drop"].map((format) => ({ format, file: `card-${format}.png` })) },
  { template: share, kind: "png", files: () => ["square", "story"].map((format) => ({ format, file: `share-${format}.png` })) },
  { template: email, kind: "html", files: () => [{ file: "email.html" }] },
  { template: page, kind: "html", files: () => [{ file: "page.html" }] },
  { template: fold, kind: "pdf", files: (v) => [{ format: v.locale === "en-US" ? "letter" : "a4", file: "card.pdf" }] },
];

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
const fonts = await loadFonts();
const failed: string[] = [];
const warnings = (d: Diagnostic[]) => d.filter((x) => x.severity !== "info");

for (const gift of gifts) {
  const values: Values = JSON.parse(await readFile(join("gifts", `${gift}.json`), "utf8"));
  // the rules a shop can read first, then every template's own check of every format: all of it before any file
  const found = problems(values);
  const jobs = OUTPUTS.flatMap((out) => out.files(values).map(({ format, file }) => ({ out, format, file, checked: out.template.check(values, format ? { format } : undefined) })));
  const snapshotOf = (j: (typeof jobs)[number]) => (j.checked.snapshots as Record<string, unknown>)[j.format ?? "default"];
  const invalid = jobs.filter((j) => !j.checked.valid || !snapshotOf(j));
  if (found.length || invalid.length) {
    failed.push(gift);
    console.log(`✗ ${gift}`);
    for (const p of found) console.log(`    ${p.field}: ${p.message}`);
    if (!found.length) for (const j of invalid) console.log(`    ${j.file}:\n${formatDiagnostics(j.checked.diagnostics)}`);
    continue;
  }
  const dir = join("out", gift);
  await mkdir(dir, { recursive: true });
  const written: string[] = [];
  for (const j of jobs) {
    const snapshot = snapshotOf(j) as never;
    let diagnostics: Diagnostic[] = [];
    if (j.out.kind === "png") {
      const r = await renderImage(snapshot, { fonts, strict: true });
      await write(join(dir, j.file), r.image);
      diagnostics = r.diagnostics;
    } else if (j.out.kind === "pdf") {
      const r = await renderPdf(snapshot, { fonts });
      await write(join(dir, j.file), r.pdf);
      diagnostics = r.diagnostics;
    } else {
      const r = await render(snapshot);
      const isEmail = j.out.template === email;
      await write(join(dir, j.file), r.html);
      if (isEmail) {
        const text = j.file.replace(/\.html$/, ".txt");
        await write(join(dir, text), r.text);
        written.push(text);
      }
      diagnostics = r.diagnostics;
    }
    written.push(j.file);
    if (warnings(diagnostics).length) console.log(`    ${j.file}:\n${formatDiagnostics(warnings(diagnostics))}`);
  }
  console.log(`✓ ${gift.padEnd(20)} ${written.length} files`);
}
if (failed.length) {
  console.log(`\n${failed.length} of ${gifts.length} gifts failed: ${failed.join(", ")}`);
  process.exitCode = 1;
}
