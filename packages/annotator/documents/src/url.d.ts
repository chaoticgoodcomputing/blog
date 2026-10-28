// The part of the URL API this package uses. It is in every runtime the package runs in (Obsidian,
// browsers, Node), but in none of the type libraries the package is checked with, which hold no
// DOM and no Node so that the source can use neither.
declare class URL {
  constructor(url: string, base?: string)
  readonly href: string
  readonly hostname: string
  readonly pathname: string
  readonly search: string
}
