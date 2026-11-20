/**
 * A gift's whole set: which template makes which file, the checks before anything is drawn, and the drawing.
 * `npm run render` writes the set into out/<gift>/; `npm run site` into site/<gift>/ for the live preview.
 *
 *   card-even.png · card-flush.png · card-drop.png    the card face
 *   share-square.png · share-story.png                 to post
 *   email.html · email.txt                             the delivery email (it embeds card-drop.png)
 *   page.html                                          the balance page
 *   card.pdf                                           the printable fold-in card (Letter for en-US, else A4)
 */
import { join } from "node:path";
import { render, type Diagnostic } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import { renderPdf } from "@hyper-elements/react/pdf";
import type { Template } from "@hyper-elements/react/template";
import { problems, type Problem } from "../src/fields";
import type { loadFonts } from "../src/fonts";
import cardImage from "../src/templates/card-image";
import email from "../src/templates/email";
import fold from "../src/templates/fold";
import page from "../src/templates/page";
import share from "../src/templates/share";

/** A gift file: untyped JSON, checked by problems() and by every template before anything is drawn. */
export type Values = Record<string, any>;
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
 * Checks a gift: the rules a shop can read first, then every template's own check of every format. `ready` is
 * false when either finds a problem; nothing should be drawn then.
 */
export function plan(values: Values) {
  const found: Problem[] = problems(values);
  const jobs = OUTPUTS.flatMap((out) =>
    out.files(values).map(({ format, file }) => {
      const checked = out.template.check(values, format ? { format } : undefined);
      return { out, file, checked, snapshot: (checked.snapshots as Record<string, unknown>)[format ?? "default"] as never };
    }),
  );
  const invalid = jobs.filter((j) => !j.checked.valid || !j.snapshot);
  return { ready: !found.length && !invalid.length, found, invalid, jobs };
}

/** Draws a checked gift's set into dir with `write`; returns the files written and what each render reported. */
export async function draw(
  jobs: ReturnType<typeof plan>["jobs"],
  dir: string,
  fonts: Awaited<ReturnType<typeof loadFonts>>,
  write: (path: string, data: string | Uint8Array) => Promise<void>,
) {
  const written: Array<{ file: string; diagnostics: Diagnostic[] }> = [];
  for (const j of jobs) {
    if (j.out.kind === "png") {
      const r = await renderImage(j.snapshot, { fonts, strict: true });
      await write(join(dir, j.file), r.image);
      written.push({ file: j.file, diagnostics: r.diagnostics });
    } else if (j.out.kind === "pdf") {
      const r = await renderPdf(j.snapshot, { fonts });
      await write(join(dir, j.file), r.pdf);
      written.push({ file: j.file, diagnostics: r.diagnostics });
    } else {
      const r = await render(j.snapshot);
      await write(join(dir, j.file), r.html);
      if (j.out.template === email) {
        const text = j.file.replace(/\.html$/, ".txt");
        await write(join(dir, text), r.text);
        written.push({ file: text, diagnostics: [] });
      }
      written.push({ file: j.file, diagnostics: r.diagnostics });
    }
  }
  return written;
}
