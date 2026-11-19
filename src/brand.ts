/**
 * Foldline: a fictional paper and stationery shop, the kit's default brand. Every gift card is a piece of folded
 * paper — origami art for each occasion, the card's corner folded along an off-axis crease, and a PDF that folds
 * into a real greeting card.
 */
import { defineTheme } from "@hyper-elements/react";
import { STACK } from "./fonts";

export const PAPER = "#F6F1E7";
export const INK = "#1E1A2B";
export const QUIET = "#6B6577";
export const RULE = "#E3DCCF";
export const WHITE = "#FFFFFF";

export type Occasion = "birthday" | "thanks" | "festive" | "congrats" | "justBecause";
export const OCCASIONS_LIST = ["birthday", "thanks", "festive", "congrats", "justBecause"] as const satisfies readonly Occasion[];

/** An occasion's colours: the card's ground, three paper colours, and the text on the ground. */
export interface Palette {
  ground: string;
  a: string;
  b: string;
  c: string;
  ink: string;
}
export interface OccasionStyle extends Palette {
  /** The line the card opens with: "Happy birthday, Priya". */
  greet: string;
  /** How far toward ink the pieces' shadows go: always darker than the ground. */
  shadow: number;
}

export const OCCASIONS: Record<Occasion, OccasionStyle> = {
  birthday: { ground: "#FFE1D2", a: "#FF6B4A", b: "#FFC23D", c: "#7B61FF", ink: "#3A1730", greet: "Happy birthday", shadow: 0.3 },
  thanks: { ground: "#D3E4C5", a: "#5E8B4E", b: "#F29C93", c: "#E06A45", ink: "#1F2D18", greet: "Thank you", shadow: 0.3 },
  festive: { ground: "#2E2150", a: "#F5A83B", b: "#E3487F", c: "#F7D774", ink: "#FBF3E4", greet: "Warm wishes", shadow: 0.5 },
  congrats: { ground: "#D6DEFF", a: "#3150F0", b: "#FFD84D", c: "#FF7AA8", ink: "#141B4D", greet: "Congratulations", shadow: 0.3 },
  justBecause: { ground: "#FDD58E", a: "#E2687A", b: "#5FA7C9", c: "#E48A2A", ink: "#3B2A12", greet: "Just because", shadow: 0.3 },
};

/** The default shop: what a gift shows when no shop of its own is given. */
export const FOLDLINE = {
  name: "Foldline",
  url: "https://foldline.example",
  supportEmail: "hello@foldline.example",
  terms: "Gift cards can be used online at foldline.example and in our shop. They can't be exchanged for cash. Lost cards can be replaced with proof of purchase.",
};

/** The email's and the page's theme: Foldline's paper, ink and type, written once. */
export const theme = defineTheme({
  colors: { background: PAPER, foreground: INK, primary: INK, primaryForeground: PAPER, muted: QUIET, border: RULE, surface: WHITE },
  fonts: { body: STACK.sans, heading: STACK.serif, mono: STACK.mono },
  fontSizes: { body: 16, small: 13 },
  lineHeights: { body: 1.55 },
  elements: {
    Heading: { fontWeight: 700, lineHeight: 1.1, by: { level: { 1: { fontSize: 34, mobile: { fontSize: 28 } }, 2: { fontSize: 24 }, 3: { fontSize: 18 } } } },
    // paper text on ink (≥ 4.5:1), and a 1px border so a dark-mode inversion keeps the button's edge
    Button: { borderRadius: 6, fontWeight: 700, padding: [14, 22], border: `1px solid ${INK}`, hover: { backgroundColor: "#3A3548" } },
  },
  styles: {
    eyebrow: { fontFamily: STACK.mono, fontSize: 12, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase" },
    sheet: { backgroundColor: WHITE, borderRadius: 8, padding: 24, gap: 12 },
  },
});
