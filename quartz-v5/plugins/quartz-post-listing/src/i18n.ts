// The listing's own strings. v4 added `postListing.title` to core's locale tables and borrowed
// core's reading-time string; a v5 plugin carries its own (FORK-LEDGER i18n/locales/definition.ts).
// Only English exists, as only v4's en-US had the title; any other locale gets it.
interface Strings {
  title: string
  empty: string
  readingTime: (minutes: number) => string
  showMore: (count: number) => string
}

const en: Strings = {
  title: "Recent Posts",
  empty: "No posts found.",
  readingTime: (minutes) => `${minutes} min read`,
  showMore: (count) => `Show ${count} more ${count === 1 ? "post" : "posts"}`,
}

const locales: Record<string, Strings> = { "en-US": en, "en-GB": en }

export const i18n = (locale?: string): Strings => locales[locale ?? ""] ?? en
