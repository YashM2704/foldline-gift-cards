/**
 * Screenshots of the rendered email and balance page, at desktop and phone widths, for looking at them (and for
 * the README). Uses an installed Chrome or Edge through playwright-core; nothing is downloaded.
 *
 *   npm run render && npm run screenshots              every gift
 *   npm run screenshots -- priya-birthday              one gift
 */
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser } from "playwright-core";

const SHOTS = [
  { file: "email.html", name: "email-desktop", width: 680 },
  { file: "email.html", name: "email-phone", width: 375 },
  { file: "page.html", name: "page-desktop", width: 1200 },
  { file: "page.html", name: "page-phone", width: 390 },
] as const;

async function launch(): Promise<Browser> {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // not installed: try the next
    }
  }
  throw new Error("Screenshots need Chrome or Edge installed: playwright-core uses the one on this computer, and downloads none.");
}

/** Stops with a sentence, not a stack trace. */
const stop = (message: string): never => {
  console.log(message);
  process.exit(1);
};

const rendered = await readdir("out").catch(() => stop("Nothing to photograph yet: run `npm run render` first."));
const asked = process.argv.slice(2);
const unknown = asked.filter((g) => !rendered.includes(g));
if (unknown.length) stop(`No rendered gift called ${unknown.map((g) => `“${g}”`).join(", ")} in out/. Rendered: ${rendered.join(", ")}.`);
const gifts = asked.length ? asked : rendered;
const browser = await launch().catch((e: Error) => stop(e.message));
try {
  for (const gift of gifts) {
    const shot: string[] = [];
    for (const s of SHOTS) {
      const page = await browser.newPage({ viewport: { width: s.width, height: 900 }, deviceScaleFactor: 2 });
      await page.goto(pathToFileURL(resolve("out", gift, s.file)).href, { waitUntil: "networkidle" });
      await page.screenshot({ path: join("out", gift, `${s.name}.png`), fullPage: true });
      await page.close();
      shot.push(`${s.name}.png`);
    }
    console.log(`✓ ${gift.padEnd(20)} ${shot.join(" · ")}`);
  }
} finally {
  await browser.close();
}
