// This plugin's own strings: v5 plugins carry their own locale tables rather than core's
// (FORK-LEDGER, `i18n/locales/definition.ts`). v4 had them in en-US only.
interface Strings {
  untitled: string
  byline: (author: string) => string
  createdWith: string
  /** The copyright line's opening word: "Copyright <a> & <b> © <year>". */
  copyright: string
  /** What the copyright line puts between two holders. */
  holderJoiner: string
}

const locales: Record<string, Strings> = {
  "en-US": {
    untitled: "Untitled",
    byline: (author) => `by ${author}`,
    createdWith: "Created with",
    copyright: "Copyright",
    holderJoiner: " & ",
  },
}

export const i18n = (locale?: string) => locales[locale ?? ""] ?? locales["en-US"]
