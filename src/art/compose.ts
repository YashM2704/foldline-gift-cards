/**
 * Each occasion's composition on the 1012 × 638 card.
 *
 * Keep-outs, for every occasion: the text column (x < 556 from y 330 down), the wordmark (x < 520 above y 170) and
 * the folded corner (x > 860 above y 160). Art lives in the right 45%; it may bleed off the right and bottom edges,
 * and strings may come in off the top edge between x 556 and 880.
 */
import type { Occasion, Palette } from "../brand";
import { balloon, cloud, confetti, crane, dart, dots, hat, lantern, star, tulip } from "./pieces";
import { place, sag, shade, tint, type Pt, type Shape } from "./shapes";

/** On the card a string's ends are held by the card's edge and its fold; on the PDF cover nothing holds them,
 *  so each visible end gets a pin: a small folded square. */
const pin = (at: Pt, c: string): Shape[] => place(confetti(c), at[0] - 9, at[1] - 9, 0.75);
export interface ComposeOptions {
  /** Composing for the PDF's front cover (the art region on its own): pin the strings' ends. */
  cover?: boolean;
}

export const COMPOSE: Record<Occasion, (p: Palette, o?: ComposeOptions) => Shape[]> = {
  birthday: (p, o) => {
    // bunting on a string that comes in off the top edge and is pinned under the fold's crease
    const s = sag(556, -4, 900, 18, 26);
    const flags = [0, 1, 2, 3, 4].flatMap((i): Shape[] => {
      const [x0, x1] = [576 + i * 62, 576 + i * 62 + 46];
      const [y0, y1] = [s.yAt(x0), s.yAt(x1)];
      const tip: Pt = [(x0 + x1) / 2 - 4, (y0 + y1) / 2 + 46];
      const mid: Pt = [(x0 + x1) / 2, (y0 + y1) / 2];
      const col = [p.a, p.b, p.c, p.a, p.b][i];
      return [
        { poly: [[x0, y0], mid, tip], fill: tint(col, 0.05) },
        { poly: [mid, [x1, y1], tip], fill: shade(col, 0.22) },
      ];
    });
    return [
      { curve: s.curve, stroke: shade(p.ground, 0.35), width: 2 },
      ...flags,
      { line: [770, 418, 752, 700], stroke: shade(p.ground, 0.4), width: 2.5 },
      ...place(balloon(p.c), 680, 200, 0.94),
      ...place(hat(p.a, p.b), 590, 420, 1.1),
      ...place(hat(p.b, p.a), 846, 360, 1.4),
      ...place(confetti(p.c), 628, 196, 1),
      ...place(confetti(p.a), 920, 232, 0.9),
      ...place(confetti(p.b), 600, 318, 0.8),
      ...place(confetti(p.a), 960, 300, 0.7),
      ...(o?.cover ? [...pin([612, s.yAt(612)], p.c), ...pin(s.at(1), p.c)] : []),
    ];
  },
  thanks: (p) => [
    ...place(tulip(p.c, p.a), 720, 160, 1.32),
    ...place(tulip(p.b, p.a), 570, 250, 1.02),
    ...place(tulip(tint(p.c, 0.25), shade(p.a, 0.1)), 850, 290, 0.9),
  ],
  festive: (p, o) => {
    // a string of lights that droops in off the top edge and out through the right edge, under the fold
    const s = sag(556, -6, 1018, 176, 22);
    const bulbs = [0.06, 0.18, 0.3, 0.42, 0.56, 0.7, 0.84, 0.96].map((t) => s.at(t));
    const hang = (x: number, scale: number, c: string) => place(lantern(c, p.c), x - 60 * scale, s.yAt(x), scale);
    return [
      { curve: s.curve, stroke: p.c, width: 2 },
      ...dots(bulbs.map(([x, y]): [number, number, number] => [x, y + 3, 5]), p.c),
      ...hang(616, 1.0, p.a),
      ...hang(752, 1.55, p.b),
      ...hang(910, 0.95, p.a),
      ...place(star(p.c), 900, 420, 1.1),
      ...place(star(p.b), 610, 470, 0.75),
      // the cover's window ends above the card's bottom: its lowest star would be cut there, so it stays off
      ...(o?.cover ? [] : place(star(p.c), 960, 552, 0.6)),
      // on the cover the string is pinned at both of its visible ends, clear of the window's edges
      ...(o?.cover ? [...pin([612, s.yAt(612)], p.c), ...pin([988, s.yAt(988)], p.c)] : []),
    ];
  },
  congrats: (p) => [
    // the dart climbs up and to the right over folded clouds; its flight trails back down to the left
    ...place(cloud(tint(p.a, 0.62)), 640, 470, 1.25),
    ...dots([[640, 404, 5], [622, 440, 4.6], [608, 478, 4.2], [598, 518, 3.8], [592, 560, 3.4], [588, 602, 3]], shade(p.ground, 0.3)),
    ...place(dart(p.a), 560, 170, 0.98),
    ...place(star(p.b), 596, 84, 1.2),
    ...place(star(p.c), 930, 300, 0.9),
  ],
  justBecause: (p) => [
    // folded hills, bleeding off the bottom, and two cranes: one near, one far
    { poly: [[556, 638], [690, 520], [830, 638]], fill: shade(p.ground, 0.12) },
    { poly: [[690, 520], [750, 556], [830, 638], [690, 638]], fill: shade(p.ground, 0.2) },
    { poly: [[730, 638], [920, 470], [1012, 530], [1012, 638]], fill: shade(p.ground, 0.18) },
    { poly: [[920, 470], [960, 540], [1012, 638], [1012, 530]], fill: shade(p.ground, 0.26) },
    ...place(crane(p.b, p.a), 576, 64, 0.4),
    ...place(crane(p.a, p.b), 536, 196, 1.12),
  ],
};
