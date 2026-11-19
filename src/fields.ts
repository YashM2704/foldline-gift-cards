/**
 * A gift's fields: what a shop (or an agent) fills in, each with its rules. Every template in the kit takes the
 * same fields, so one gift's values make the whole set: its card image, email, page, printable card and shares.
 */
import { prop } from "@hyper-elements/react";
import { FOLDLINE, OCCASIONS_LIST } from "./brand";
import { nameProblem, PRINTABLE, shopProblem, unprintable } from "./text";

/** Gift codes use a Crockford alphabet: no I, L, O or U, so a code typed from paper can't be misread. */
const CODE = "[0-9A-HJKMNP-TV-Z]{4}";
const name = (label: string, guidance: string) => prop.text({ label, required: true, maxLength: 32, pattern: PRINTABLE, guidance });

export const fields = {
  occasion: prop.choice(OCCASIONS_LIST, { label: "Occasion", required: true, guidance: "Sets the card's art, colours and greeting." }),
  amount: prop.number({ label: "Amount", required: true, min: 1, max: 100000, integer: true }),
  currency: prop.choice(["INR", "USD", "EUR", "GBP"], { label: "Currency", default: "INR" }),
  locale: prop.choice(["en-IN", "en-US", "en-GB", "de-DE"], {
    label: "Number & date format",
    default: "en-IN",
    description: "How money and dates are written (₹1,00,000 · $100,000 · 100.000 €). The copy stays English; en-US also prints the card on US Letter.",
  }),
  to: name("To", "The recipient's name as they'd sign it. It has to fit the card on a line of its own."),
  from: name("From", "Who the gift is from, as the recipient knows them."),
  message: prop.text({ label: "Message", maxLength: 240, pattern: PRINTABLE, guidance: "Write it like a handwritten note: first person, warm, no emoji." }),
  code: prop.text({ label: "Gift code", required: true, pattern: `^${CODE}-${CODE}-${CODE}$`, description: "Twelve characters in three groups: K7QP-2M9X-4TRA." }),
  expires: prop.date({ label: "Expires", required: true }),
  redeemUrl: prop.link({ label: "Redeem link", required: true, description: "The button, and the QR code on the printed card." }),
  balanceUrl: prop.link({ label: "Balance page link" }),
  printUrl: prop.link({ label: "Printable card link", description: "Where the PDF is: the email and the page link to it." }),
  cardImageUrl: prop.link({ label: "Card image URL", description: "Where the shop hosts this gift's card image; the email shows it. Rendered locally it's card.png beside the email." }),
  balance: prop.number({ label: "Balance", min: 0, max: 100000, description: "What's left on the card (the balance page). Defaults to the amount." }),
  history: prop.list(
    prop.object(
      {
        date: prop.date({ label: "Date", required: true }),
        label: prop.text({ label: "What", required: true, maxLength: 60, pattern: PRINTABLE }),
        amount: prop.number({ label: "Amount", required: true, description: "Positive for money added, negative for money spent." }),
      },
      { label: "Entry" },
    ),
    { label: "History", max: 20 },
  ),
  barcode: prop.text({ label: "In-store barcode", maxLength: 40, pattern: "^[\\u0020-\\u007E]*$", description: "A Code 128 value. The page shows a barcode only when it's set." }),
  showAmount: prop.boolean({ label: "Show the amount", default: true, guidance: "Off hides the value on the card, the share images, the email and the printed card. The balance page always shows the balance." }),
  shopName: prop.text({ label: "Shop name", default: FOLDLINE.name, maxLength: 40, pattern: PRINTABLE }),
  shopUrl: prop.link({ label: "Shop website", default: FOLDLINE.url }),
  supportEmail: prop.text({ label: "Support email", default: FOLDLINE.supportEmail, pattern: "^[^@\\s]+@[^@\\s]+$" }),
  terms: prop.text({ label: "Terms", default: FOLDLINE.terms, maxLength: 400, pattern: PRINTABLE }),
};

/** What every template's example is: Priya's birthday gift from Arjun. */
export const example = {
  occasion: "birthday",
  amount: 2500,
  currency: "INR",
  locale: "en-IN",
  to: "Priya",
  from: "Arjun",
  message: "Happy birthday! Get yourself that fountain pen you keep looking at.",
  code: "K7QP-2M9X-4TRA",
  expires: "2027-11-18",
  redeemUrl: "https://foldline.example/redeem?code=K7QP-2M9X-4TRA",
  balanceUrl: "https://foldline.example/balance/K7QP-2M9X-4TRA",
  printUrl: "https://foldline.example/gift/K7QP-2M9X-4TRA/card.pdf",
} as const;

export interface Problem {
  field: string;
  message: string;
}
/**
 * The rules a pattern can't say, as sentences a shop can show beside the field: a name that won't fit the card,
 * a character no font draws, a shop name too long for the wordmark. Run before rendering; templates refuse the
 * same values in their render, so nothing slips past a direct render either.
 */
export function problems(v: { to?: string; from?: string; message?: string; shopName?: string; code?: string; balance?: number; amount?: number }): Problem[] {
  const out: Problem[] = [];
  const add = (field: string, message: string | null) => message && out.push({ field, message });
  if (v.code !== undefined && !new RegExp(`^${CODE}-${CODE}-${CODE}$`).test(v.code))
    add("code", `“${v.code}” isn't a gift code: three groups of four capital letters and digits, without I, L, O or U (like K7QP-2M9X-4TRA).`);
  if (v.to !== undefined) add("to", nameProblem(v.to));
  if (v.from !== undefined) add("from", nameProblem(v.from));
  if (v.message !== undefined) add("message", unprintable(v.message));
  if (v.shopName !== undefined) add("shopName", shopProblem(v.shopName));
  if (v.balance !== undefined && v.amount !== undefined && v.balance > v.amount) add("balance", `The balance (${v.balance}) can't be more than the card's amount (${v.amount}).`);
  return out;
}

/** In a template's render: refuse what problems() refuses, with the same sentence. */
export function assertPrintable(v: Parameters<typeof problems>[0]) {
  const found = problems(v);
  if (found.length) throw new Error(found.map((p) => `${p.field}: ${p.message}`).join(" · "));
}
