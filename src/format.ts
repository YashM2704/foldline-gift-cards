/** Small formatting shared by the templates: dates, links as people read them, a gift's shop. */
import { formatDate } from "@hyper-elements/react/template";
import { FOLDLINE } from "./brand";

/** "18 Nov 2027", or "Nov 18, 2027" for en-US. The locale picks the order; the words stay English, as the copy is
 *  (a German month beside English sentences reads as a mistake). */
export const date = (iso: string, locale: string) => formatDate(iso, locale === "en-US" ? "en-US" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

/** A link as a person reads it on paper: host and path, no scheme, query or tracking, at most `max` characters. */
export function shortUrl(href: string, max = 36): string {
  try {
    const u = new URL(href);
    const s = (u.host + u.pathname).replace(/\/$/, "");
    return s.length <= max ? s : u.host;
  } catch {
    return href.slice(0, max);
  }
}

/** The shop a gift is from: its own fields, or Foldline's. */
export function shopOf(v: { shopName?: string; shopUrl?: string | { href: string }; supportEmail?: string; terms?: string }) {
  const url = typeof v.shopUrl === "object" ? v.shopUrl.href : (v.shopUrl ?? FOLDLINE.url);
  const name = v.shopName ?? FOLDLINE.name;
  return { name, url, host: shortUrl(url), supportEmail: v.supportEmail ?? FOLDLINE.supportEmail, terms: v.terms ?? FOLDLINE.terms, isFoldline: name === FOLDLINE.name };
}

/** A link field's href (link values may come back as a string or as { href }). */
export const href = (link: string | { href: string } | undefined) => (link === undefined ? undefined : typeof link === "string" ? link : link.href);
