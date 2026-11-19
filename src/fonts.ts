/**
 * The kit's fonts. Each weight is one TrueType file from Google Fonts holding every subset the kit draws (Latin,
 * Latin-1, Latin Extended-A, ₹) with its kerning, and Martel for Devanagari.
 *
 * One file per weight matters: the image renderer lays text out word by word and may break a line wherever the
 * font file changes, even inside a word. With every subset in one file, a word never changes file part-way.
 *
 * The URLs go in each root's `fonts` prop, as the official gallery's templates do: the Hyper Elements CLI fetches
 * and caches them, browsers load them, and `loadFonts()` gives the same files to renderPdf() and renderImage().
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

export interface Face {
  family: string;
  weight: number;
  style: "normal" | "italic";
  src: string;
}

const GSTATIC = "https://fonts.gstatic.com/s";
export const FACES: Face[] = [
  { family: "Fraunces", weight: 400, style: "italic", src: `${GSTATIC}/fraunces/v38/6NVf8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9vIVYX9G37lvd9sPEKsxx664UJf1hLTc7frUo.ttf` },
  { family: "Fraunces", weight: 600, style: "normal", src: `${GSTATIC}/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcaRyTB_7W.ttf` },
  { family: "Fraunces", weight: 700, style: "normal", src: `${GSTATIC}/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcUByTB_7W.ttf` },
  { family: "Instrument Sans", weight: 400, style: "normal", src: `${GSTATIC}/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSTF-Tf8kyk.ttf` },
  { family: "Instrument Sans", weight: 500, style: "normal", src: `${GSTATIC}/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npST3-Tf8kyk.ttf` },
  { family: "Instrument Sans", weight: 700, style: "normal", src: `${GSTATIC}/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSQi_jf8kyk.ttf` },
  { family: "Red Hat Mono", weight: 600, style: "normal", src: `${GSTATIC}/redhatmono/v16/jVyY7nDnA2uf2zVvFAhhzEs-VMSjJpBTfgjwQYPPy7bHvQ.ttf` },
  { family: "Martel", weight: 400, style: "normal", src: `${GSTATIC}/martel/v12/PN_xRfK9oXHga0XdZ8g6.ttf` },
  { family: "Martel", weight: 700, style: "normal", src: `${GSTATIC}/martel/v12/PN_yRfK9oXHga0XV3e0qgxzT.ttf` },
];

/** The roots' `fonts` prop: what the CLI fetches, and what an email or a page links. */
export const FONTS = FACES.map(({ family, weight, style, src }) => ({ family, weight, style, src, format: "truetype" as const }));

/** CSS stacks, so an email client without the web fonts still draws something close. */
export const STACK = {
  serif: "Fraunces, Georgia, 'Times New Roman', serif",
  sans: "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'Red Hat Mono', Menlo, Consolas, monospace",
};

const CACHE = join("node_modules", ".cache", "gift-card-kit", "fonts");
const cached = (f: Face) => join(CACHE, `${f.family.toLowerCase().replace(/ /g, "-")}-${f.weight}-${f.style}.ttf`);

/** Every face's file, fetched once into node_modules/.cache, then read from there. */
export async function loadFonts(): Promise<Array<Omit<Face, "src"> & { src: Uint8Array }>> {
  await mkdir(CACHE, { recursive: true });
  return Promise.all(
    FACES.map(async (face) => {
      const path = cached(face);
      try {
        await access(path);
      } catch {
        const res = await fetch(face.src);
        if (!res.ok) throw new Error(`Couldn't fetch ${face.family} ${face.weight} ${face.style} (${res.status}): ${face.src}`);
        await writeFile(path, new Uint8Array(await res.arrayBuffer()));
      }
      return { family: face.family, weight: face.weight, style: face.style, src: await readFile(path) };
    }),
  );
}
