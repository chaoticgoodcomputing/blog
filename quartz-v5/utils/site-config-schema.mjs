// The site config against Quartz's plugin config schema (#89, #97).
//
// Quartz ships a JSON Schema for its config, `quartz/plugins/quartz-plugins.schema.json` in Core
// source, but only for editors (upstream's templates point `yaml-language-server` at it); Quartz
// never validates a config against it itself. The `site-config` repo guard does, against Core's
// schema, and the upgrade's API-surface report (#100) does against a target ref's: so the schema is
// always an input here, read from whichever Core tree is asked for, never assumed.
//
// The validator is small and has no dependencies. It knows the JSON Schema keywords Quartz's schema
// uses, and reports any other keyword as an error rather than skipping it, so a target ref whose
// schema grows a new kind of constraint is never passed silently.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { CORE_DIR } from "./core-tiers.mjs"

/** The schema's path inside a Core tree (Core, or an upstream checkout at any ref). */
export const SCHEMA_REL = "quartz/plugins/quartz-plugins.schema.json"

/** The plugin config schema of the Core tree at `coreDir`: Core's own, or any upstream checkout's. */
export const siteConfigSchema = (coreDir = CORE_DIR) => JSON.parse(fs.readFileSync(path.join(coreDir, SCHEMA_REL), "utf-8"))

// Keywords that only describe; they constrain nothing.
const ANNOTATIONS = new Set(["$schema", "$id", "$comment", "title", "description", "default", "examples", "deprecated"])
const KNOWN = new Set([
  ...ANNOTATIONS,
  "type",
  "enum",
  "const",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "oneOf",
  "anyOf",
  "minimum",
  "maximum",
])

const typeOf = (value) =>
  value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" ? (Number.isInteger(value) ? "integer" : "number") : typeof value
const isType = (value, type) => typeOf(value) === type || (type === "number" && typeOf(value) === "integer")
const show = (value) => JSON.stringify(value)
const at = (base, key) => (typeof key === "number" ? `${base}[${key}]` : base ? `${base}.${key}` : key)
// A short name for a oneOf/anyOf alternative, for the message that none matched.
const nameOf = (schema, i) => schema.title ?? (schema.type ? [schema.type].flat().join("|") : `alternative ${i + 1}`)

/**
 * Every way `value` breaks `schema`, as `{ path, message }`, in document order. `path` is dotted,
 * with `[i]` for array items (`plugins[3].layout.position`), and `""` for the root.
 */
export function validate(value, schema, where = "") {
  if (schema === true || schema === undefined) return []
  if (schema === false) return [{ path: where, message: "is not allowed here" }]
  const errors = []
  const fail = (message, path = where) => errors.push({ path, message })

  for (const keyword of Object.keys(schema)) {
    if (!KNOWN.has(keyword)) fail(`the schema uses "${keyword}", which this validator does not support: extend utils/site-config-schema.mjs`)
  }
  if (schema.type !== undefined) {
    const types = [schema.type].flat()
    if (!types.some((type) => isType(value, type))) {
      fail(`must be ${types.join(" or ")}, not ${typeOf(value)}`)
      return errors // nothing else about a value of the wrong type is worth saying
    }
  }
  if (schema.enum && !schema.enum.some((option) => show(option) === show(value))) {
    fail(`must be one of ${schema.enum.map(show).join(", ")}, not ${show(value)}`)
  }
  if ("const" in schema && show(schema.const) !== show(value)) fail(`must be ${show(schema.const)}, not ${show(value)}`)
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) fail(`must be >= ${schema.minimum}, not ${value}`)
    if (schema.maximum !== undefined && value > schema.maximum) fail(`must be <= ${schema.maximum}, not ${value}`)
  }
  if (typeOf(value) === "object") {
    for (const key of schema.required ?? []) if (!(key in value)) fail("is required", at(where, key))
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties && key in schema.properties) errors.push(...validate(child, schema.properties[key], at(where, key)))
      else if (schema.additionalProperties === false) fail("is not allowed here: the schema has no such key", at(where, key))
      else if (typeof schema.additionalProperties === "object") errors.push(...validate(child, schema.additionalProperties, at(where, key)))
    }
  }
  if (Array.isArray(value) && schema.items) value.forEach((item, i) => errors.push(...validate(item, schema.items, at(where, i))))
  for (const keyword of ["oneOf", "anyOf"]) {
    if (!schema[keyword]) continue
    const results = schema[keyword].map((alternative) => validate(value, alternative, where))
    const matching = results.filter((result) => result.length === 0).length
    if (matching === 0) {
      const why = results.map((result, i) => `${nameOf(schema[keyword][i], i)} (${result.map(({ path, message }) => (path === where ? message : `${path.slice(where.length).replace(/^\./, "")} ${message}`)).join("; ")})`)
      fail(`must match one of ${results.length} alternatives, and matches none: ${why.join("; or ")}`)
    } else if (keyword === "oneOf" && matching > 1) {
      fail(`must match exactly one of ${results.length} alternatives, and matches ${matching}`)
    }
  }
  return errors
}

// Upstream at the pinned ref, for the amendments' citations.
const upstream = (file, line) => `https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/${file}#L${line}`

/**
 * Where Core's schema lags Core's own loader. The loader's types, which the config loader reads the
 * site config by, allow more than the schema says, and the site config uses it. Each amendment adds
 * exactly what the loader takes to the schema at `pointer` (a JSON Pointer): `values` to an enum, or
 * a `property` with its schema to a `properties` map. Nothing is ever loosened beyond the loader.
 * An upgrade whose schema has caught up is told to retire the amendment (`amendSchema`).
 */
export const SCHEMA_AMENDMENTS = [
  {
    name: "the header and footer layout positions",
    why: `LayoutPosition includes "header" and "footer" (${upstream("quartz/plugins/loader/types.ts", 11)}); the site's footer uses one`,
    pointer: "/properties/plugins/items/properties/layout/properties/position/enum",
    values: ["header", "footer"],
  },
  {
    name: "a page type's frame template",
    why: `PageTypeLayoutOverride has \`template?: string\` (${upstream("quartz/plugins/loader/types.ts", 178)}); the site's 404 and annotation pages set one`,
    pointer: "/properties/layout/properties/byPageType/additionalProperties/properties",
    property: "template",
    schema: { type: "string", description: "Override the page frame template" },
  },
]

const resolve = (schema, pointer) =>
  pointer
    .split("/")
    .slice(1)
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), schema)

/**
 * `schema` with `SCHEMA_AMENDMENTS` applied, and a line for each amendment it did not need (the schema
 * already has all of it: retire it) or could not apply (the schema has no `pointer`: rework it). The
 * schema passed in is never changed.
 */
export function amendSchema(schema) {
  const amended = structuredClone(schema)
  const notes = []
  for (const amendment of SCHEMA_AMENDMENTS) {
    const target = resolve(amended, amendment.pointer)
    if (amendment.values ? !Array.isArray(target) : !target || typeof target !== "object") {
      notes.push(`Schema amendment for ${amendment.name} cannot apply: the schema has nothing at ${amendment.pointer}. Rework or retire it in utils/site-config-schema.mjs.`)
    } else if (amendment.values) {
      const missing = amendment.values.filter((value) => !target.includes(value))
      if (missing.length === 0) notes.push(`Schema amendment for ${amendment.name} is already in the schema (${amendment.values.join(", ")}): retire it in utils/site-config-schema.mjs.`)
      target.push(...missing)
    } else if (amendment.property in target) {
      notes.push(`Schema amendment for ${amendment.name} is already in the schema (${amendment.property}): retire it in utils/site-config-schema.mjs.`)
    } else {
      target[amendment.property] = amendment.schema
    }
  }
  return { schema: amended, notes }
}

// Core's own YAML parser: the one Quartz reads the site config with.
const yaml = () => createRequire(path.join(CORE_DIR, "package.json"))("yaml")

/**
 * Every way a site config breaks a plugin config schema, as `{ path, message }`. `config` is the
 * config's YAML text, or the config already parsed. `schema` is the schema as a Core tree has it
 * (`siteConfigSchema`); `SCHEMA_AMENDMENTS` are applied to it first. An empty config (nothing but
 * comments, even) is one error, and YAML that does not parse is another.
 */
export function validateSiteConfig(config, schema) {
  let value = config
  if (typeof config === "string") {
    try {
      value = yaml().parse(config)
    } catch (err) {
      return [{ path: "", message: `is not valid YAML: ${err.message.split("\n")[0]}` }]
    }
  }
  if (value === null || value === undefined) return [{ path: "", message: "is empty: the site config holds no configuration and no plugins" }]
  return validate(value, amendSchema(schema).schema)
}

/** One error as a line of a report. */
export const formatError = ({ path, message }) => `${path || "(the site config)"}: ${message}`
