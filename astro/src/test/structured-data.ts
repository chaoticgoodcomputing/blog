// A page's JSON-LD as a structured-data validator reads it, for the specs over either vault. Each
// item is checked against schema.org's own vocabulary, as validator.schema.org checks it: its type
// is one of schema.org's, each property is one of schema.org's that a thing of that type can have,
// and each value is of a type the property takes.
//
// The vocabulary is schemas/schema-org.json: schema.org's release 30.1, from the file its `source`
// names, with each class's parents and each property's domain and range kept, and nothing else.

import fs from "node:fs"
import type { Page } from "@playwright/test"
import { expect } from "./site.ts"

interface Vocabulary {
  classes: Record<string, string[]>
  properties: Record<string, { domain: string[]; range: string[] }>
}

const vocabulary = JSON.parse(
  fs.readFileSync(new URL("./schemas/schema-org.json", import.meta.url), "utf8"),
) as Vocabulary

// Whether a class is `ancestor` or under it.
function isA(type: string, ancestor: string): boolean {
  return type === ancestor || (vocabulary.classes[type] ?? []).some((parent) => isA(parent, ancestor))
}

// Whether a literal is of one of the data types in a property's range. Text takes any string, and
// so does a type under it but URL, which takes a whole address; Date and DateTime take ISO 8601.
function literalFits(value: unknown, range: string[]): boolean {
  if (typeof value === "boolean") return range.includes("Boolean")
  if (typeof value === "number")
    return range.includes("Number") || (range.includes("Integer") && Number.isInteger(value))
  if (typeof value !== "string") return false
  return range.some((type) => {
    if (type === "URL") return /^https?:\/\//.test(value) && URL.canParse(value)
    if (type === "DateTime") return /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(value)
    if (type === "Date") return /^\d{4}-\d\d-\d\d$/.test(value)
    return isA(type, "Text")
  })
}

function itemErrors(item: unknown, where: string): string[] {
  if (typeof item !== "object" || item === null || Array.isArray(item)) return [`${where}: not an item`]
  const record = item as Record<string, unknown>
  const type = record["@type"]
  if (typeof type !== "string") return [`${where}: no @type`]
  if (!(type in vocabulary.classes)) return [`${where}: ${type} is not a type of schema.org's`]

  const errors: string[] = []
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("@")) continue
    const property = vocabulary.properties[key]
    if (!property) {
      errors.push(`${where}.${key}: not a property of schema.org's`)
      continue
    }
    if (!property.domain.some((each) => isA(type, each))) {
      errors.push(`${where}.${key}: not a property of a ${type}, but of ${property.domain.join(", ")}`)
    }
    const values = Array.isArray(value) ? value : [value]
    for (const [index, each] of values.entries()) {
      const at = Array.isArray(value) ? `${where}.${key}[${index}]` : `${where}.${key}`
      const takes = `where ${key} takes ${property.range.join(", ")}`
      if (typeof each === "object" && each !== null) {
        const own = (each as Record<string, unknown>)["@type"]
        if (typeof own === "string" && !property.range.some((range) => isA(own, range))) {
          errors.push(`${at}: a ${own}, ${takes}`)
        }
        errors.push(...itemErrors(each, at))
      } else if (!literalFits(each, property.range)) {
        errors.push(`${at}: ${JSON.stringify(each)}, ${takes}`)
      }
    }
  }
  return errors
}

/** What is wrong with one top-level item of JSON-LD, by schema.org: nothing, for a valid one. */
export function structuredDataErrors(item: unknown): string[] {
  const context = (item as Record<string, unknown> | null)?.["@context"]
  return [...(context === "https://schema.org" ? [] : [`$: @context is not schema.org`]), ...itemErrors(item, "$")]
}

/** The JSON-LD items in the open page, each checked against schema.org on the way. */
export async function readStructuredData(page: Page): Promise<Record<string, unknown>[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
  const items = scripts.map((script) => JSON.parse(script) as Record<string, unknown>)
  for (const item of items) expect(structuredDataErrors(item), page.url()).toEqual([])
  return items
}
