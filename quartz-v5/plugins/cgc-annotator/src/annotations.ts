// Annotations as Obsidian's Annotator writes them into an annotation page (CONTEXT.md). Each one is
// a block quote holding a hidden `annotation-json` code block, the markdown Annotator renders for
// Obsidian, and a block id:
//
//   >%%
//   >```annotation-json
//   >{"text":"…","target":[{"source":"…","selector":[…]}],"created":"…",…}
//   >```
//   >%%
//   >*%%PREFIX%%…%%HIGHLIGHT%% ==…== %%POSTFIX%%…*
//   >%%LINK%%[[#^id|show annotation]]
//   >%%COMMENT%%
//   >…
//   >%%TAGS%%
//   >…
//   ^id
//
// The JSON is the record; everything after it is Annotator's view of it for Obsidian.

/** One annotation: a passage of the source document, and what was written about it. */
export interface Annotation {
  /** Annotator's block id, unique within its page. */
  id: string
  /** The passage, as its `TextQuoteSelector` quotes it. Empty when it has none. */
  exact: string
  /** A little of the text before and after the passage, which tells repeats apart. */
  prefix?: string
  suffix?: string
  /** Where the passage starts in the document's text, from its `TextPositionSelector`: a hint. */
  start?: number
  /** The note written on the passage, in markdown. */
  text?: string
  tags: string[]
  /** When it was written, as an ISO date. */
  created?: string
}

/** An annotation with its note rendered through the site's pipeline. */
export interface RenderedAnnotation extends Annotation {
  /** The note as HTML, when there is one. */
  html?: string
}

/** What a page's source yields: its annotations, and where each block sits in the source. */
export interface Found {
  annotations: Annotation[]
  /** `[start, end)` offsets of every annotation block, `^id` included. */
  spans: [number, number][]
  /** Blocks whose JSON didn't parse, by id. */
  unreadable: string[]
}

const BLOCK = />%%[ \t]*\r?\n>```annotation-json[ \t]*\r?\n((?:>.*\r?\n)*?)>```[ \t]*\r?\n>%%[\s\S]*?\n\^([a-z0-9]+)(?=\s|$)/g

interface Selector {
  type?: string
  exact?: string
  prefix?: string
  suffix?: string
  start?: number
}

/** Every annotation block in a page's source, in source order. */
export function findAnnotations(source: string): Found {
  const found: Found = { annotations: [], spans: [], unreadable: [] }
  for (const match of source.matchAll(BLOCK)) {
    const [block, jsonLines, id] = match
    found.spans.push([match.index!, match.index! + block.length])
    let record: any
    try {
      record = JSON.parse(jsonLines.split(/\r?\n/).map((line) => line.replace(/^>/, "")).join("\n"))
    } catch {
      found.unreadable.push(id)
      continue
    }
    const selectors: Selector[] = record?.target?.[0]?.selector ?? []
    const quote = selectors.find((s) => s?.type === "TextQuoteSelector")
    const position = selectors.find((s) => s?.type === "TextPositionSelector")
    found.annotations.push({
      id,
      exact: typeof quote?.exact === "string" ? quote.exact : "",
      prefix: typeof quote?.prefix === "string" ? quote.prefix : undefined,
      suffix: typeof quote?.suffix === "string" ? quote.suffix : undefined,
      start: typeof position?.start === "number" ? position.start : undefined,
      text: typeof record.text === "string" && record.text.trim() !== "" ? record.text : undefined,
      tags: Array.isArray(record.tags) ? record.tags.filter((t: unknown) => typeof t === "string") : [],
      created: typeof record.created === "string" ? record.created : undefined,
    })
  }
  // In the order their passages come in the document; one with no position keeps its place last.
  found.annotations.sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity))
  return found
}
