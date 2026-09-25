// This plugin's own strings: v5 plugins carry their own locale tables rather than core's
// (FORK-LEDGER, `i18n/locales/definition.ts`). v4 had the title in en-US only.
interface Strings {
  /** The explorer's heading, and the name of the button that opens its drawer. */
  title: string
  /** The name of the button that opens or closes a tag, for the tag named. */
  fold: (tag: string) => string
  /** The name of the button that closes the drawer. */
  close: string
}

const locales: Record<string, Strings> = {
  "en-US": {
    title: "Tag Explorer",
    fold: (tag) => `Subtags and pages of ${tag}`,
    close: "Close",
  },
}

export const i18n = (locale?: string): Strings => locales[locale ?? ""] ?? locales["en-US"]
