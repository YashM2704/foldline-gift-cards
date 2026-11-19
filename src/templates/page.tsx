/**
 * Foldline gift card — the balance page: what's left, the code, Redeem, what it's been spent on. The card shows
 * without its face value here, so the balance is the only number on the page.
 *
 * States: all spent (Redeem goes, the history stays), expired (the code and Redeem go, support shows), no history.
 * "Expired" is decided against `asOf`: a template never reads the clock.
 */
import { Button, Column, Grid, Heading, LineBreak, Link, Page, Row, Section, Span, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { mix } from "../art/shapes";
import { INK, OCCASIONS, PAPER, QUIET, RULE, theme, WHITE } from "../brand";
import { assertPrintable, example, fields } from "../fields";
import { FONTS, STACK } from "../fonts";
import { date, href, shopOf, shortUrl } from "../format";
import { Card, frameSize } from "../parts/Card";
import { Mark } from "../parts/Mark";
import { Qr } from "../parts/Qr";
import { money } from "../text";

const DESKTOP_CARD = 440, PHONE_CARD = 336; // 336 fits a 375px phone's column; centred on wider ones

/** For galleries and tools that list designs, as the official gallery's files do. */
export const meta = {
  title: "Foldline gift card balance page",
  description: "What's left on a gift card, its code, its history and how to use it, with spent and expired states.",
  root: "Page",
};

export default template({
  id: "foldline.GiftBalance",
  version: "1.0.0",
  label: "Gift card balance page",
  description: "The gift card's page: the balance, the code, Redeem, its history, and how to use it. Spent and expired states.",
  guidance: "Give balance, history and asOf from the shop's records; the page shows exactly what it's given.",
  root: "Page",
  fields,
  example,
  rules: { root: { lang: true } },
  render(v) {
    assertPrintable(v);
    const shop = shopOf(v);
    const o = OCCASIONS[v.occasion];
    const balance = Math.max(0, Math.min(v.balance ?? v.amount, v.amount));
    const expired = v.asOf !== undefined && v.asOf > v.expires;
    const spent = !expired && balance === 0;
    const m = (n: number) => money(n, v.currency, v.locale);
    const redeem = href(v.redeemUrl)!;
    const printUrl = href(v.printUrl);
    const history = v.history ?? [];
    const fill = balance / v.amount;
    const card = (width: number) => <Card {...v} showAmount={false} frame="drop" width={width} />;
    const amountLine = (n: number) => (n < 0 ? `−${m(-n)}` : `+${m(n)}`);
    const label = { apply: ["eyebrow"], color: QUIET } as const;

    return (
      <Page theme={theme} fonts={FONTS} lang="en" width={1040} title={`${shop.name} gift card · ${v.to}`}
        description={`The balance and code of ${v.to}'s ${shop.name} gift card.`} style={{ gap: 0 }}>
        <Section style={{ padding: [22, 32], border: { bottom: `1px solid ${RULE}` }, mobile: { padding: [18, 20] } }}>
          <Row stackOnMobile={false} style={{ alignItems: "center", justifyContent: "space-between" }}>
            <Row stackOnMobile={false} style={{ flex: "none", gap: 10, alignItems: "center" }}>
              {shop.isFoldline && <Mark color={INK} fold={mix(INK, PAPER, 0.55)} size={22} />}
              <Text style={{ flex: "none", fontFamily: STACK.serif, fontSize: 22, fontWeight: 600 }}>{shop.name}</Text>
            </Row>
            <Text style={{ flex: "none", textAlign: "right" }}><Link href={`mailto:${shop.supportEmail}`}>Help</Link></Text>
          </Row>
        </Section>

        <Section style={{ padding: [48, 32, 40, 32], gap: 48, mobile: { padding: [28, 20], gap: 32 } }}>
          {/* the card and its balance; on phones the card comes first, smaller */}
          <Row style={{ gap: 48, alignItems: "center" }}>
            <Column style={{ width: frameSize("drop", DESKTOP_CARD).width, alignItems: "center", mobile: { width: "100%" as never } }}>
              <Column hidden={{ mobile: true }}>{card(DESKTOP_CARD)}</Column>
              <Column hidden={{ desktop: true }}>{card(PHONE_CARD)}</Column>
            </Column>
            <Column style={{ gap: 14 }}>
              <Text style={label}>{`A gift from ${v.from}`}</Text>
              {expired ? (
                <>
                  <Heading level={1}>Expired on {date(v.expires, v.locale)}</Heading>
                  <Text style={{ color: QUIET }}>This card can't be used any more. If you think that's wrong, write to <Link href={`mailto:${shop.supportEmail}`}>{shop.supportEmail}</Link>.</Text>
                </>
              ) : (
                <>
                  <Column style={{ gap: 2 }}>
                    <Heading level={1} style={{ fontSize: 48, mobile: { fontSize: 40 } }}>{m(balance)} left</Heading>
                    <Text style={{ color: QUIET }}>{balance === v.amount ? "Nothing spent yet" : `of ${m(v.amount)}`}</Text>
                  </Column>
                  {/* the bar: what's left, on a track the colour of a rule; a sliver shows while anything is */}
                  <Row stackOnMobile={false} style={{ height: 10, backgroundColor: mix(PAPER, QUIET, 0.35), borderRadius: 5, overflow: "hidden" }}>
                    {fill > 0 && <Column style={{ width: `${Math.max(2, Math.round(fill * 100))}%` as never, height: 10, backgroundColor: INK }} />}
                  </Row>
                  <Text style={{ fontSize: 14, color: QUIET }}>{spent ? `All spent. It's been a pleasure.` : `Expires ${date(v.expires, v.locale)}`}</Text>
                  <Column style={{ backgroundColor: WHITE, border: `1.5px dashed ${QUIET}`, borderRadius: 8, padding: [12, 16], gap: 2 }}>
                    <Text style={label}>Your code</Text>
                    <Text style={{ fontFamily: STACK.mono, fontSize: 26, fontWeight: 600, letterSpacing: 3, mobile: { fontSize: 22, letterSpacing: 2 } }}>{v.code}</Text>
                  </Column>
                  {!spent && <Button href={redeem}>Redeem online</Button>}
                  {printUrl && !spent && <Text style={{ fontSize: 14 }}><Link href={printUrl}>Print it as a card (PDF)</Link> · double-sided, flip on the short edge</Text>}
                </>
              )}
            </Column>
          </Row>

          <Column style={{ gap: 12 }}>
            <Heading level={2}>History</Heading>
            {history.length ? (
              <>
                <Table hidden={{ mobile: true }} style={{ cellPadding: [10, 0], rowBorder: { width: 1, style: "solid", color: token("colors.border") } }}>
                  {history.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell style={{ width: 130, color: QUIET }}>{date(h.date, v.locale)}</TableCell>
                      <TableCell>{h.label}</TableCell>
                      <TableCell style={{ width: 120, textAlign: "right", fontFamily: STACK.mono }}>{amountLine(h.amount)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
                <Table hidden={{ desktop: true }} style={{ cellPadding: [10, 0], rowBorder: { width: 1, style: "solid", color: token("colors.border") } }}>
                  {history.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {h.label}
                        <LineBreak />
                        <Span style={{ fontSize: 14, color: QUIET }}>{date(h.date, v.locale)}</Span>
                      </TableCell>
                      <TableCell style={{ width: 110, textAlign: "right", verticalAlign: "top", fontFamily: STACK.mono }}>{amountLine(h.amount)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              </>
            ) : (
              <Text style={{ color: QUIET }}>No purchases yet.</Text>
            )}
          </Column>

          {/* how to use it: only while there's something to use */}
          {!expired && !spent && (
            <Column style={{ gap: 16 }}>
              <Heading level={2}>How to use it</Heading>
              <Grid columns={3} style={{ gap: 16 }}>
                {[
                  ["1 · Online", <>Tap Redeem, or go to <Link href={redeem}>{shortUrl(redeem)}</Link>.</>],
                  ["2 · At checkout", <>Enter the code. It takes off what you spend, up to the balance.</>],
                  ["3 · What's left", <>Anything you don't spend stays on the card until {date(v.expires, v.locale)}.</>],
                ].map(([title, body], i) => (
                  <Column key={i} style={{ apply: ["sheet"], gap: 6 }}>
                    <Text style={{ fontWeight: 700 }}>{title}</Text>
                    <Text style={{ fontSize: 14, color: QUIET }}>{body}</Text>
                  </Column>
                ))}
              </Grid>
            </Column>
          )}

          {v.barcode && !expired && !spent && (
            <Row style={{ gap: 20, alignItems: "center" }}>
              <Column style={{ width: 132 }}><Qr value={v.barcode} size={132} color={INK} title={`The in-store code for this card, ${v.barcode}`} /></Column>
              <Column style={{ gap: 4 }}>
                <Text style={{ fontWeight: 700 }}>In the shop</Text>
                <Text style={{ fontSize: 14, color: QUIET }}>Show this code at the till; it reads the card's balance.</Text>
              </Column>
            </Row>
          )}
        </Section>

        <Section style={{ padding: [24, 32, 40, 32], gap: 6, border: { top: `1px solid ${RULE}` }, mobile: { padding: [20, 20, 32, 20] } }}>
          <Text style={{ fontSize: 14, color: QUIET }}>{shop.name} · <Link href={shop.url}>{shop.host}</Link> · <Link href={`mailto:${shop.supportEmail}`}>{shop.supportEmail}</Link></Text>
          <Text style={{ fontSize: 13, color: QUIET }}>{shop.terms}</Text>
        </Section>
      </Page>
    );
  },
});
