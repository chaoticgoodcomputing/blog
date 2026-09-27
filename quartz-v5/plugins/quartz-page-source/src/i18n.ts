// This plugin's own strings: v5 plugins carry their own locale tables rather than core's
// (FORK-LEDGER, `i18n/locales/definition.ts`). v4 had the link text in en-US only.
const locales: Record<string, { linkText: string }> = {
  "en-US": { linkText: "View source on GitHub" },
}

export const i18n = (locale?: string) => locales[locale ?? ""] ?? locales["en-US"]
