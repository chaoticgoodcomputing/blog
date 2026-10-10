// What Obsidian's syntax, and an MDX note's, looks like when nothing rendered it: the patterns the
// vault spec (vault/rendering-gate.spec.ts) looks for in a body's text, without its code, where
// syntax is shown on purpose.
export const UNRENDERED_SYNTAX: Record<string, RegExp> = {
  "a wikilink or an embed": /!?\[\[[^\]\n]+\]\]/,
  "a highlight": /(?<![=\w])==[^=\s][^=\n]*[^=\s]==(?![=\w])/,
  "a comment": /%%/,
  "a callout": /\[![a-z-]+\][+-]?/i,
  "a block id": /(?:^|\s)\^[A-Za-z0-9-]{3,}$/m,
  "display math": /\$\$/,
  "an MDX import": /^\s*import\s+[{\w][^\n]*\sfrom\s+["“]/m,
  "an MDX component": /<[A-Z][a-z]+[A-Za-z]*[\s/>]/,
}
