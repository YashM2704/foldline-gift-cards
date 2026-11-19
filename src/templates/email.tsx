/**
 * Foldline gift card — the delivery email: "Priya, Arjun sent you a gift". The card (an image the shop hosts: the
 * card image template's `drop` format, exactly the card's width, so it lines up with the column on both edges), the
 * note on a square-cornered sheet, the code as live text in a coupon (it reads with images off), the button, how to
 * use it, the details. The copy is English, so the email's language is English whatever the number format.
 *
 * With showAmount off the value is nowhere in it: not the preheader, the card, the image's alt text or the details.
 */
import { Button, Column, Email, Heading, Image, Link, List, ListItem, Section, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { ReactNode } from "react";
import { QUIET, RULE, theme, WHITE } from "../brand";
import { assertPrintable, example, fields } from "../fields";
import { FONTS, STACK } from "../fonts";
import { date, href, shopOf, shortUrl } from "../format";
import { frameSize } from "../parts/Card";
import { money, smart } from "../text";

const CONTENT = 536; // 600 less the 32px gutters

export default template({
  id: "foldline.GiftEmail",
  version: "1.0.0",
  label: "Gift card delivery email",
  description: "The email that delivers the gift: the card, the note, the code (live text), a Redeem button and the details.",
  guidance: "Host the card image (card-drop.png) and give its URL as cardImageUrl; the subject is the email's title.",
  root: "Email",
  fields,
  example,
  rules: { root: { previewText: true, lang: true } },
  render(v) {
    assertPrintable(v);
    const shop = shopOf(v);
    const show = v.showAmount !== false;
    const value = money(v.amount, v.currency, v.locale);
    const redeem = href(v.redeemUrl)!;
    const balanceUrl = href(v.balanceUrl);
    const printUrl = href(v.printUrl);
    const card = frameSize("drop");
    const detail = (label: string, content: ReactNode) => (
      <TableRow>
        <TableCell style={{ width: 120, color: QUIET }}>{label}</TableCell>
        <TableCell>{content}</TableCell>
      </TableRow>
    );
    return (
      <Email theme={theme} width={600} fonts={FONTS} lang="en" title={`${v.to}, ${v.from} sent you a gift`}
        previewText={show ? `${v.from} sent you a ${value} gift card. Your code is inside.` : `${v.from} sent you a gift card. Your code is inside.`}>
        <Section style={{ padding: [32, 32, 0, 32] }}>
          <Text style={{ fontFamily: STACK.serif, fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>{shop.name}</Text>
        </Section>
        <Section style={{ padding: [24, 32, 32, 32], gap: 22 }}>
          <Column style={{ gap: 8 }}>
            <Text style={{ apply: ["eyebrow"] }}>{v.to},</Text>
            <Heading level={1}>{v.from} sent you a gift</Heading>
          </Column>
          <Image src={{ src: href(v.cardImageUrl) ?? "card-drop.png", width: card.width, height: card.height }} alt={show ? `${value} ${shop.name} gift card for ${v.to}` : `${shop.name} gift card for ${v.to}`} style={{ width: CONTENT }} />
          {v.message && (
            <Column style={{ backgroundColor: WHITE, border: `1px solid ${RULE}`, padding: 24, gap: 10 }}>
              <Text style={{ fontFamily: STACK.serif, fontStyle: "italic", fontSize: 20, lineHeight: 1.45 }}>{smart(v.message)}</Text>
              <Text>— {v.from}</Text>
            </Column>
          )}
          <Column style={{ backgroundColor: WHITE, border: `1.5px dashed ${QUIET}`, borderRadius: 8, padding: [16, 20], gap: 4 }}>
            <Text style={{ apply: ["eyebrow"], color: QUIET }}>Your code</Text>
            <Text style={{ fontFamily: STACK.mono, fontSize: 32, fontWeight: 600, letterSpacing: 4, lineHeight: 1.25, mobile: { fontSize: 24, letterSpacing: 2 } }}>{v.code}</Text>
          </Column>
          <Button href={redeem}>Redeem your gift</Button>
          <List type="number" style={{ gap: 6 }}>
            <ListItem>Tap Redeem, or go to <Link href={redeem}>{shortUrl(redeem)}</Link></ListItem>
            <ListItem>Enter the code at checkout</ListItem>
            <ListItem>Anything you don't spend stays on the card</ListItem>
          </List>
          <Table style={{ cellPadding: [8, 0], rowBorder: { width: 1, style: "solid", color: token("colors.border") } }}>
            {show
              ? detail("Amount", value)
              : detail("Value", balanceUrl ? <Link href={balanceUrl}>See your balance</Link> : "Shown when you redeem")}
            {detail("Expires", date(v.expires, v.locale))}
            {balanceUrl && show ? detail("Balance", <Link href={balanceUrl}>See your balance</Link>) : null}
            {printUrl ? detail("Print it", <><Link href={printUrl}>A card to print and fold (PDF)</Link>, double-sided, flip on the short edge</>) : null}
          </Table>
        </Section>
        <Section style={{ padding: [0, 32, 40, 32] }}>
          <Column style={{ gap: 8, padding: [24, 0, 0, 0], border: { top: `1px solid ${RULE}` } }}>
            <Text style={{ fontSize: 13, color: QUIET }}>
              Sent by {shop.name} on behalf of {v.from}. Not expecting this? Write to <Link href={`mailto:${shop.supportEmail}`}>{shop.supportEmail}</Link>.
            </Text>
            <Text style={{ fontSize: 12, color: QUIET }}>{shop.terms}</Text>
            <Text style={{ fontSize: 12, color: QUIET }}><Link href={shop.url}>{shop.host}</Link></Text>
          </Column>
        </Section>
      </Email>
    );
  },
});
