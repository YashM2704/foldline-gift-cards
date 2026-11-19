/**
 * Foldline gift card — the printable fold-in card. Two landscape pages: print them double-sided (flip on the short
 * edge), fold once, and it's an A5 greeting card with the gift card inside.
 *
 *   page 1, outside:  back (shop, terms, how to print)  |  front cover (the occasion's origami, "For Priya")
 *   page 2, inside:   the note                           |  the card, its code, a QR code to redeem it
 *
 * Every edge keeps 10 mm clear (home printers can't print to the edge) and the fold a 20 mm band, so nothing wraps
 * round it. The cover is the card's art on paper: no solid dark grounds for a home inkjet to soak.
 */
import { Column, Document, Layer, Line, Row, Svg, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { COMPOSE } from "../art/compose";
import { drawShapes, isDark, luminance, mix, pale } from "../art/shapes";
import { INK, OCCASIONS, PAPER, QUIET, WHITE } from "../brand";
import { assertPrintable, example, fields } from "../fields";
import { FONTS } from "../fonts";
import { date, href, shopOf, shortUrl } from "../format";
import { Card, H, W } from "../parts/Card";
import { Mark } from "../parts/Mark";
import { Qr } from "../parts/Qr";
import { fitSize, fitWrapped, Lines, measure, preferNoWidow, smart, steps, wrap } from "../text";

const MM = 96 / 25.4; // a Document's px are 96 to the inch
const mm = (v: number) => Math.round(v * MM * 100) / 100;
const PAPERS = { a4: { size: "A4", w: 297, h: 210 }, letter: { size: "Letter", w: 279.4, h: 215.9 } } as const;
const EDGE = 10, FOLD = 20, PAD = 8; // mm: kept clear at every edge, the band round the fold, inside each panel

/** "For {to}": one line from 52px down to 24px; else "For" above the name, at the size the name fits. */
function coverName(to: string, width: number) {
  const one = `For ${to}`;
  if (measure(one, "fraunces-400i", 24) <= width) return { size: fitSize(one, "fraunces-400i", width, 52, 24), lines: [one] };
  return { size: fitSize(to, "fraunces-400i", width, 52, 24), lines: ["For", to] };
}

/** For galleries and tools that list designs, as the official gallery's files do. */
export const meta = {
  title: "Foldline fold-in gift card",
  description: "Two pages to print double-sided and fold once into an A5 greeting card, the gift card and a QR code inside.",
  root: "Document",
};

export default template({
  id: "foldline.GiftFoldCard",
  version: "1.0.0",
  label: "Printable fold-in gift card",
  description: "Two pages to print double-sided and fold once: an A5 greeting card, the gift card and its code inside.",
  guidance: "Print double-sided, flip on the short edge, at actual size. en-US gifts print on Letter, the rest on A4.",
  root: "Document",
  formats: { a4: { size: "A4", orientation: "landscape" }, letter: { size: "Letter", orientation: "landscape" } },
  fields,
  example,
  render(v, { format }) {
    assertPrintable(v);
    const paper = PAPERS[format];
    const o = OCCASIONS[v.occasion];
    const shop = shopOf(v);
    const [pageW, pageH] = [mm(paper.w), mm(paper.h)];
    const panelMm = (paper.w - 2 * EDGE - FOLD) / 2;
    const [panelW, panelH] = [mm(panelMm), mm(paper.h - 2 * EDGE)];
    const contentW = Math.floor(panelW - 2 * mm(PAD)); // from the panel itself, rounded down, so it always fits
    const contentH = panelH - mm(2 * PAD);
    const foldX = pageW / 2;

    // ----- the cover: the card's art region (x 556…1012, nearly A5) on paper, in a square-cornered window -----
    const ground = isDark(o.ground) ? PAPER : mix(PAPER, o.ground, 0.6); // hills and clouds keep a light tint
    const deepen = (c: string) => (luminance(c) > 0.72 ? mix(c, "#9A5B00", 0.38) : c); // pale on paper → warm amber
    const coverInk = luminance(o.ink) > 0.5 ? INK : o.ink;
    const art = COMPOSE[v.occasion]({ ...o, ground, a: deepen(o.a), b: deepen(o.b), c: deepen(o.c) }, { cover: true });
    const name = coverName(v.to, contentW);
    // The window runs to the panel's top and right edges, so the art ends where the paper does (cream to white, the
    // way it bleeds off the card), and it has a ground of its own: a pale tint of the card's, so its bottom edge reads
    // as an edge rather than a line the art stops on. The art region is the card's x 556…W, scaled to the window and
    // cropped (by its viewBox) to the window's height: a drawing taller than its box would be shrunk to fit, not cut.
    const windowW = Math.floor(panelW - mm(PAD)); // rounded down, so it always fits the panel
    const artFullH = (windowW * H) / (W - 556);
    const windowH = Math.round(Math.min(artFullH, panelH - mm(PAD) - name.lines.length * name.size * 1.1 - 60));
    const windowGround = pale(o.ground, 0.87); // the ground's own hue, pale: lavender for the night card, not grey

    // ----- the note: as large as it fits (up to 40px), else smaller, never cut -----
    const message = v.message ? smart(v.message) : `${o.greet}, ${v.to}.`;
    const fromH = 40;
    const note =
      preferNoWidow(steps(40, 18).map((size) => fitWrapped(message, "fraunces-400i", contentW, [size], Math.floor((contentH - fromH) / (size * 1.4))))) ??
      { size: 18, lines: wrap(message, "fraunces-400i", 18, contentW) };

    const redeem = href(v.redeemUrl)!;
    const panel = { width: panelW, height: panelH, flex: "none" as const, padding: mm(PAD), justifyContent: "center" as const };
    const label = { fontFamily: "Red Hat Mono", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" } as const;

    return (
      <Document size={paper.size} orientation="landscape" margin={0} fonts={FONTS} lang="en" title={`${o.greet}, ${v.to}: a ${shop.name} gift card`}
        style={{ fontFamily: "Instrument Sans", color: INK, fontSize: 13, lineHeight: 1.45 }}>
        {/* page 1, outside: the back | the front cover */}
        <Document.Page>
          <Layer style={{ width: pageW, height: pageH }}>
            {/* fold ticks: 3 mm marks at the fold, in the margins, top and bottom */}
            <Svg width={pageW} height={pageH} viewBox={`0 0 ${pageW} ${pageH}`} title="">
              <Line x1={foldX} y1={mm(7)} x2={foldX} y2={mm(EDGE)} style={{ stroke: QUIET, strokeWidth: 0.75 }} />
              <Line x1={foldX} y1={pageH - mm(EDGE)} x2={foldX} y2={pageH - mm(7)} style={{ stroke: QUIET, strokeWidth: 0.75 }} />
            </Svg>
            <Row style={{ width: pageW, height: pageH, padding: mm(EDGE), gap: mm(FOLD) }}>
              <Column style={{ ...panel, justifyContent: "end", alignItems: "center", gap: 10 }}>
                {shop.isFoldline && <Mark color={INK} fold={mix(INK, PAPER, 0.55)} size={22} />}
                <Text style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 20, textAlign: "center" }}><Lines lines={[shop.name]} weight={600} /></Text>
                <Text style={{ fontSize: 11, color: QUIET, textAlign: "center" }}>{`${shop.host} · ${shop.supportEmail}`}</Text>
                <Text style={{ fontSize: 9, color: QUIET, textAlign: "center", lineHeight: 1.5 }}><Lines lines={wrap(shop.terms, "sans-400", 9, contentW)} family="Instrument Sans" /></Text>
                <Text style={{ fontSize: 9.33, color: QUIET, textAlign: "center" }}>Print double-sided · flip on short edge · actual size</Text>
              </Column>
              <Column style={{ ...panel, padding: [0, 0, mm(PAD), mm(PAD)], backgroundColor: PAPER, justifyContent: "space-between", gap: 16 }}>
                <Column style={{ width: windowW, height: windowH, overflow: "hidden", backgroundColor: windowGround }}>
                  <Svg width={windowW} height={windowH} viewBox={`556 0 ${W - 556} ${Math.round((windowH * (W - 556)) / windowW)}`} title={`${o.greet}: folded-paper art`}>
                    {drawShapes(art, { dx: 7, dy: 9, color: mix(windowGround, INK, 0.16) })}
                    {drawShapes(art)}
                  </Svg>
                </Column>
                <Column style={{ gap: 8, color: coverInk, padding: [0, mm(PAD), 0, 0] }}>
                  <Text style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: name.size, lineHeight: 1.1 }}><Lines lines={name.lines} /></Text>
                  <Row style={{ gap: 8, alignItems: "center" }}>
                    {shop.isFoldline && <Mark color={coverInk} fold={mix(coverInk, PAPER, 0.55)} size={16} />}
                    <Text style={{ flex: "none", fontFamily: "Fraunces", fontWeight: 600, fontSize: 15 }}><Lines lines={[shop.name]} weight={600} /></Text>
                  </Row>
                </Column>
              </Column>
            </Row>
          </Layer>
        </Document.Page>

        {/* page 2, inside: the note | the gift */}
        <Document.Page>
          <Row style={{ width: pageW, height: pageH, padding: mm(EDGE), gap: mm(FOLD) }}>
            <Column style={{ ...panel, gap: 14 }}>
              <Text style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: note.size, lineHeight: 1.4 }}><Lines lines={note.lines} /></Text>
              <Text style={{ fontSize: 15, fontWeight: 500 }}><Lines lines={[`— ${v.from}`]} family="Instrument Sans" /></Text>
            </Column>
            <Column style={{ ...panel, gap: 14, alignItems: "center" }}>
              <Card {...v} width={contentW} />
              <Column style={{ width: contentW, border: `1.5px dashed ${INK}`, borderRadius: 6, padding: [10, 14], gap: 2, backgroundColor: WHITE }}>
                <Text style={{ ...label, color: QUIET }}>Your code</Text>
                <Text style={{ fontFamily: "Red Hat Mono", fontSize: 24, fontWeight: 600, letterSpacing: 2.5 }}>{v.code}</Text>
              </Column>
              <Row style={{ width: contentW, gap: 14, alignItems: "center" }}>
                <Qr value={redeem} size={mm(26)} color={INK} title={`A QR code that opens ${shortUrl(redeem)}`} />
                <Column style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12.5 }}>{`1  Scan, or go to ${shortUrl(redeem)}`}</Text>
                  <Text style={{ fontSize: 12.5 }}>2  Enter the code at checkout</Text>
                  <Text style={{ fontSize: 12.5, color: QUIET }}>{`Use by ${date(v.expires, v.locale)}`}</Text>
                </Column>
              </Row>
            </Column>
          </Row>
        </Document.Page>
      </Document>
    );
  },
});
