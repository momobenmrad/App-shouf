/**
 * Text normalisation for Tunisian addresses written in Arabic script, derja,
 * French, or Arabizi (Latin letters with digits: 7 = ح, 9 = ق, 3 = ع, 5 = خ).
 */

export type Relation = "near" | "front" | "behind" | "at";

// Relation words are matched on the normalised text, so they are written normalised too.
const RELATIONS: [Relation, string[]][] = [
  ["front", ["قدام", "امام", "قبالة", "9odem", "9dem", "qodem", "9oddem", "devant", "en face de", "en face"]],
  ["behind", ["ورا", "وراء", "خلف", "wra", "ouara", "derriere"]],
  ["near", ["بحذا", "حذا", "قريب من", "قريب", "جنب", "7dha", "b7dha", "hdha", "7dhe", "9rib", "qrib", "jnab", "pres de", "a cote de", "proche de", "pres"]],
  ["at", ["في", "fi", "au", "a la", "chez"]],
];

/** Lowercase, strip Arabic diacritics and Latin accents, unify letter variants. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Latin accents
    .replace(/[\u064B-\u0655\u0670\u0640]/g, "") // tashkeel, decomposed hamza (أ → ا), tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/[«»"'’`.,;:!?()\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Removes the leading relation word ("حذا", "9odem", "près de"…) and reports it. */
export function splitRelation(text: string): { relation: Relation; rest: string } {
  const n = normalize(text);
  for (const [relation, words] of RELATIONS) {
    for (const w of words.map(normalize).sort((a, b) => b.length - a.length)) {
      const re = new RegExp(`^(?:${escape(w)})\\s+`);
      if (re.test(n)) return { relation, rest: n.replace(re, "").trim() };
    }
  }
  return { relation: "at", rest: n };
}

/** True when the token appears as a whole word (or phrase) inside the text. */
export function containsPhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  const re = new RegExp(`(^|\\s)${escape(phrase)}(\\s|$)`);
  return re.test(text);
}
