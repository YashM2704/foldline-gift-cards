/**
 * The live preview: every gift's whole set, and an index page that is itself a Hyper Elements Page. GitHub Actions
 * builds it from the source on every push to main and publishes it with GitHub Pages (.github/workflows/pages.yml).
 *
 *   npm run site     site/index.html, and site/<gift>/ for each gift in gifts/
 *
 * In the preview a gift's balance and print links open its own page and PDF. Redeem and the shop's links go to
 * foldline.example: Foldline is a fictional shop.
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { Column, formatDiagnostics, Heading, Image, Link, Page, render, Row, Section, Text, type Diagnostic } from "@hyper-elements/react";
import { mix } from "../src/art/shapes";
import { INK, OCCASIONS, PAPER, QUIET, RULE, theme } from "../src/brand";
import { FONTS, loadFonts, STACK } from "../src/fonts";
import { frameSize } from "../src/parts/Card";
import { Mark } from "../src/parts/Mark";
import { money } from "../src/text";
import { draw, plan, type Values } from "./outputs";

const OUT = "site";
const REPO = "https://github.com/YashM2704/foldline-gift-cards";
/** Priya's gift first: it's every template's example. */
const FIRST = "priya-birthday";
const problems = (d: Diagnostic[]) => d.filter((x) => x.severity !== "info");

const fonts = await loadFonts().catch((e: Error) => {
  console.log(e.message);
  process.exit(1);
});
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const names = (await readdir("gifts")).filter((f) => f.endsWith(".json")).map((f) => basename(f, ".json"));
names.sort((a, b) => Number(b === FIRST) - Number(a === FIRST) || a.localeCompare(b));

const gifts: Array<{ name: string; v: Values }> = [];
for (const name of names) {
  const gift: Values = JSON.parse(await readFile(join("gifts", `${name}.json`), "utf8"));
  // the links a reader can follow here: the gift's own balance page and printable card, beside its email
  const v = { ...gift, balanceUrl: "page.html", printUrl: "card.pdf" };
  const { ready, found, invalid, jobs } = plan(v);
  if (!ready) {
    console.log(`✗ ${name}`);
    for (const p of found) console.log(`    ${p.field}: ${p.message}`);
    for (const j of invalid) console.log(`    ${j.file}:\n${formatDiagnostics(j.checked.diagnostics)}`);
    process.exit(1);
  }
  const dir = join(OUT, name);
  await mkdir(dir, { recursive: true });
  for (const w of await draw(jobs, dir, fonts, writeFile)) {
    if (problems(w.diagnostics).length) {
      console.log(`✗ ${name}/${w.file}:\n${formatDiagnostics(problems(w.diagnostics))}`);
      process.exit(1);
    }
  }
  gifts.push({ name, v });
  console.log(`✓ ${name}`);
}
await copyFile("docs/hero.png", join(OUT, "hero.png"));

// ---------- the index: a Hyper Elements Page in the kit's own theme ----------

const CONTENT = 976;
const THUMB = 300;
const thumb = frameSize("even", THUMB);
const label = { apply: ["eyebrow"], color: QUIET } as const;

function Gift({ name, v }: { name: string; v: Values }) {
  const o = OCCASIONS[v.occasion as keyof typeof OCCASIONS];
  const value = money(v.amount, v.currency, v.locale);
  const at = (file: string) => `${name}/${file}`;
  const link = (text: string, file: string) => <Link href={at(file)}>{text}</Link>;
  return (
    <Row style={{ gap: 32, alignItems: "center", padding: [24, 0], border: { top: `1px solid ${RULE}` }, mobile: { gap: 16 } }}>
      <Column style={{ width: thumb.width, flex: "none", mobile: { width: "100%" as never } }}>
        <Link href={at("card-even.png")}>
          <Image src={{ src: at("card-even.png"), width: 1084, height: 710 }} alt={`${o.greet}, ${v.to}: the card`} style={{ width: thumb.width }} />
        </Link>
      </Column>
      <Column style={{ gap: 8 }}>
        <Heading level={3} style={{ fontFamily: STACK.serif, fontSize: 24, fontStyle: "italic", fontWeight: 400 }}>{o.greet}, {v.to}</Heading>
        <Text style={{ color: QUIET }}>
          {v.showAmount === false ? `${value}, the value hidden on the card` : value} · from {v.from} · {v.locale}
        </Text>
        <Column style={{ gap: 4 }}>
          <Text>{link("The email", "email.html")} (or {link("as plain text", "email.txt")}) · {link("The balance page", "page.html")}</Text>
          <Text>
            {link(`The card to print (PDF, ${v.locale === "en-US" ? "Letter" : "A4"})`, "card.pdf")} · Share images: {link("square", "share-square.png")}, {link("story", "share-story.png")}
          </Text>
        </Column>
      </Column>
    </Row>
  );
}

const index = (
  <Page theme={theme} fonts={FONTS} lang="en" width={1040} title="Foldline gift cards · live preview"
    description="A gift card kit built with Hyper Elements: five gifts, each with its card, email, balance page, printable fold-in card and share images." style={{ gap: 0 }}>
    <Section style={{ padding: [22, 32], border: { bottom: `1px solid ${RULE}` }, mobile: { padding: [18, 20] } }}>
      <Row stackOnMobile={false} style={{ alignItems: "center", justifyContent: "space-between" }}>
        <Row stackOnMobile={false} style={{ flex: "none", gap: 10, alignItems: "center" }}>
          <Mark color={INK} fold={mix(INK, PAPER, 0.55)} size={22} />
          <Text style={{ flex: "none", fontFamily: STACK.serif, fontSize: 22, fontWeight: 600 }}>Foldline gift cards</Text>
        </Row>
        <Text style={{ flex: "none", textAlign: "right" }}><Link href={REPO}>Source</Link></Text>
      </Row>
    </Section>
    <Section style={{ padding: [48, 32, 24, 32], gap: 16, mobile: { padding: [28, 20, 16, 20] } }}>
      <Text style={label}>A gift card kit built with Hyper Elements</Text>
      <Heading level={1} style={{ fontFamily: STACK.serif, fontSize: 44, mobile: { fontSize: 34 } }}>One gift, its whole set</Heading>
      <Text style={{ fontSize: 18, maxWidth: 680 }}>
        Each gift below is one JSON file. Five templates turn it into a card image, a delivery email, a balance page, a card to print and
        fold, and images to share. Everything here was drawn by those templates, and this page is a Hyper Elements Page too.
      </Text>
    </Section>
    <Section style={{ padding: [8, 32, 32, 32], mobile: { padding: [8, 20, 24, 20] } }}>
      <Link href="hero.png">
        <Image src={{ src: "hero.png", width: 2400, height: 1300 }} alt="The printed card opened flat, the delivery email, the balance page and a share image" style={{ width: CONTENT, borderRadius: 8 }} />
      </Link>
    </Section>
    <Section style={{ padding: [16, 32, 40, 32], gap: 8, mobile: { padding: [8, 20, 32, 20] } }}>
      <Heading level={2}>Five gifts</Heading>
      {gifts.map((g) => <Gift key={g.name} {...g} />)}
    </Section>
    <Section style={{ padding: [24, 32, 40, 32], gap: 6, border: { top: `1px solid ${RULE}` }, mobile: { padding: [20, 20, 32, 20] } }}>
      <Text style={{ fontSize: 14, color: QUIET }}>
        Foldline is a fictional paper shop, so Redeem and the shop's links go to foldline.example, which doesn't exist. The balance and print
        links open each gift's own page and PDF. Print the PDF double-sided, flipped on the short edge, and fold it once.
      </Text>
      <Text style={{ fontSize: 14, color: QUIET }}><Link href={REPO}>Source on GitHub</Link> · MIT licence</Text>
    </Section>
  </Page>
);

const page = await render(index);
if (problems(page.diagnostics).length) {
  console.log(`✗ index.html:\n${formatDiagnostics(problems(page.diagnostics))}`);
  process.exit(1);
}
await writeFile(join(OUT, "index.html"), page.html);
console.log(`✓ index.html · ${gifts.length} gifts in ${OUT}/`);
