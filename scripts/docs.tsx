/**
 * The README's pictures, made from the kit's own outputs: every image in docs/ comes from `npm run render`, and the
 * hero is itself a Hyper Elements Canvas laying those outputs out.
 *
 *   npm run render && npm run docs
 *
 * Needs an installed Chrome or Edge (the email, the page and the PDF's print HTML are photographed in it).
 */
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Canvas, Column, Image, Row, Text, render } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import gifenc from "gifenc";
import { PNG } from "pngjs";
import { chromium, type Browser } from "playwright-core";
import { mix } from "../src/art/shapes";
import { INK, OCCASIONS_LIST, PAPER, QUIET } from "../src/brand";
import { FONTS, loadFonts } from "../src/fonts";
import { Card, frameSize } from "../src/parts/Card";
import { Mark } from "../src/parts/Mark";
import fold from "../src/templates/fold";

const { applyPalette, GIFEncoder, quantize } = gifenc; // CommonJS: its functions come on the default export
const DOCS = "docs";
const GIFTS = { birthday: "priya-birthday", thanks: "margaret-thanks", festive: "ananya-festive", congrats: "sam-congrats", justBecause: "lena-just-because" } as const;
const stop = (message: string): never => {
  console.log(message);
  process.exit(1);
};

await access(join("out", GIFTS.birthday, "card-even.png")).catch(() => stop("Nothing to picture yet: run `npm run render` first."));
await mkdir(join(DOCS, "cards"), { recursive: true });
const fonts = await loadFonts();
const gift = async (name: string) => JSON.parse(await readFile(join("gifts", `${name}.json`), "utf8"));

// 1. the card faces and share images, as rendered
for (const [occasion, name] of Object.entries(GIFTS)) await copyFile(join("out", name, "card-even.png"), join(DOCS, "cards", `${occasion}.png`));
await copyFile(join("out", GIFTS.birthday, "share-square.png"), join(DOCS, "share-square.png"));
await copyFile(join("out", GIFTS.festive, "share-story.png"), join(DOCS, "share-story.png"));

// 2. the email, the page and the PDF's two pages, photographed in an installed Chrome or Edge
async function launch(): Promise<Browser> {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // not installed: try the next
    }
  }
  return stop("The README's pictures need Chrome or Edge installed: playwright-core uses the one on this computer.");
}
const browser = await launch();
/** A screenshot: the whole page, or (with a height) just its top, the window's size — the hero's crops. */
const shoot = async (file: string, width: number, scale: number, out: string, height?: number) => {
  const page = await browser.newPage({ viewport: { width, height: height ?? 900 }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: "networkidle" });
  await page.screenshot({ path: out, fullPage: height === undefined });
  await page.close();
};
const crops = join("out", "_hero"); // the hero's cropped inputs: outputs, not docs
await mkdir(crops, { recursive: true });
await shoot(join("out", GIFTS.birthday, "email.html"), 680, 2, join(DOCS, "email.png"));
await shoot(join("out", GIFTS.justBecause, "email.html"), 375, 2, join(DOCS, "email-phone.png"));
await shoot(join("out", GIFTS.birthday, "page.html"), 1200, 1, join(DOCS, "page.png"));
await shoot(join("out", GIFTS.birthday, "page.html"), 375, 2, join(DOCS, "page-phone.png"));
// for the hero: the top of each, exactly the 330 × 980 they're shown at
await shoot(join("out", GIFTS.justBecause, "email.html"), 375, 2, join(crops, "email.png"), Math.round((980 * 375) / 330));
// the page ends in the gap after the first how-to card (it ends at 1134 and the next starts at 1150), not across one
await shoot(join("out", GIFTS.birthday, "page.html"), 390, 2, join(crops, "page.png"), 1142);
{
  const checked = fold.check(await gift(GIFTS.birthday), { format: "a4" });
  const { html } = await render((checked.snapshots as Record<string, unknown>).a4 as never);
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1.5 });
  await page.setContent(html, { waitUntil: "networkidle" });
  // print HTML leaves the page to the paper; on screen, paint it the paper's white
  await page.addStyleTag({ content: "section.elements-page { background: #fff; }" });
  const pages = page.locator("section.elements-page");
  await pages.nth(0).screenshot({ path: join(DOCS, "fold-outside.png") });
  await pages.nth(1).screenshot({ path: join(DOCS, "fold-inside.png") });
  await page.close();
}
await browser.close();

// 3. the five occasions as a GIF: each card on paper, a second and a half each
{
  const width = 640, cardW = 580;
  const size = frameSize("even", cardW);
  const gif = GIFEncoder();
  for (const [occasion, name] of Object.entries(GIFTS)) {
    const v = await gift(name);
    const { image } = await renderImage(
      <Canvas width={width} height={size.height + 40} fonts={FONTS} style={{ backgroundColor: PAPER, padding: [20, (width - size.width) / 2] }}>
        <Card {...v} occasion={occasion} frame="even" width={cardW} />
      </Canvas>,
      { fonts, strict: true },
    );
    const png = PNG.sync.read(Buffer.from(image));
    const rgba = new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength);
    const palette = quantize(rgba, 256);
    gif.writeFrame(applyPalette(rgba, palette), png.width, png.height, { palette, delay: 1600 });
  }
  gif.finish();
  await writeFile(join(DOCS, "occasions.gif"), gif.bytes());
}

// 4. the hero: the kit's outputs from its example gifts, laid out by Hyper Elements itself
{
  const files = {
    fold: join(DOCS, "fold-inside.png"), email: join(crops, "email.png"), story: join(DOCS, "share-story.png"), page: join(crops, "page.png"),
    festive: join(DOCS, "cards", "festive.png"), justBecause: join(DOCS, "cards", "justBecause.png"),
  } as const;
  const images: Record<string, Uint8Array> = {};
  const dims: Record<string, { width: number; height: number }> = {};
  for (const [key, path] of Object.entries(files)) {
    const bytes = await readFile(path);
    const png = PNG.sync.read(bytes);
    images[key] = bytes;
    dims[key] = { width: png.width, height: png.height };
  }
  const img = (key: keyof typeof files, width: number, height?: number) => (
    <Column style={{ width, height: height ?? Math.round((dims[key].height * width) / dims[key].width), overflow: "hidden", borderRadius: 10 }}>
      <Image src={{ src: key, ...dims[key] }} alt="" style={{ width }} />
    </Column>
  );
  const label = (text: string) => <Text style={{ fontFamily: "Red Hat Mono", fontWeight: 600, fontSize: 18, letterSpacing: 2.5, textTransform: "uppercase", color: QUIET }}>{text}</Text>;
  const { image } = await renderImage(
    <Canvas width={2400} height={1300} fonts={FONTS} style={{ backgroundColor: PAPER, padding: [72, 80], gap: 48, fontFamily: "Instrument Sans", color: INK }}>
      <Row style={{ gap: 18, alignItems: "center" }}>
        <Mark color={INK} fold={mix(INK, PAPER, 0.55)} size={56} />
        <Text style={{ flex: "none", fontFamily: "Fraunces", fontWeight: 700, fontSize: 64, letterSpacing: -1 }}>Foldline gift cards</Text>
        <Text style={{ flex: "none", fontSize: 30, color: QUIET, padding: [14, 0, 0, 16] }}>One gift. Five templates. Nine files. Built with Hyper Elements.</Text>
      </Row>
      <Row style={{ gap: 40, alignItems: "start" }}>
        <Column style={{ gap: 14, flex: "none" }}>{label("Card, to print and fold")}{img("fold", 900)}
          <Row style={{ gap: 24 }}>{img("festive", 438)}{img("justBecause", 438)}</Row>
        </Column>
        <Column style={{ gap: 14, flex: "none" }}>{label("Email")}{img("email", 330, 980)}</Column>
        <Column style={{ gap: 14, flex: "none" }}>{label("Balance page")}{img("page", 330, 980)}</Column>
        <Column style={{ gap: 14, flex: "none" }}>{label("To share")}{img("story", 551, 980)}</Column>
      </Row>
    </Canvas>,
    { fonts, images, strict: true },
  );
  await writeFile(join(DOCS, "hero.png"), image);
}

console.log(`✓ docs/: hero.png · occasions.gif · cards/ (5) · share-square.png · share-story.png · email.png · email-phone.png · page.png · page-phone.png · fold-outside.png · fold-inside.png`);
