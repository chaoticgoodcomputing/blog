// The upgrade's API-surface report (#89, #100): what changed between the pinned ref and an upgrade's
// target in every upstream API the site depends on, so the owner knows what to review before
// trusting the result. The upgrade prints it right after the fetch, before the tree is touched, and
// `site-v5:upgrade-report` prints it alone.
//
// Six categories, each of which says so when it has nothing to report:
//   1. the default config (`quartz.config.default.yaml`, pruned from Core, so read from the upstream
//      cache): plugins and option keys added, removed or renamed;
//   2. the plugin config schema, and every error of our site config against the target's;
//   3. the `quartz.ts` template;
//   4. the exported plugin, component, loader, condition and frame APIs, and which of them the site's
//      steering files use (`registerCondition` and `loadQuartzLayout` above all);
//   5. Core's `package.json` dependencies and engines;
//   6. our packages' peer ranges that the target's Core versions no longer satisfy.
//
// Everything here reads trees as Maps of Core-relative path → `{ content: Buffer }` (the upgrade's
// `ctx.base`, `ctx.next` and `ctx.ours`) plus the site repo on disk, and writes nothing.
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import os from "node:os"
import { parseYaml, workspacePackages } from "./packages.mjs"
import { SCHEMA_REL, amendSchema, formatError, validateSiteConfig } from "./site-config-schema.mjs"

const DEFAULT_CONFIG = "quartz.config.default.yaml"
const SITE_CONFIG = "quartz.config.yaml"
const TEMPLATE = "quartz.ts"

/** The exported APIs the report compares, by kind: each a list of Core-relative files or directories. */
export const API_FILES = {
  Plugin: [
    "quartz/plugins/types.ts",
    "quartz/plugins/index.ts",
    "quartz/plugins/config.ts",
    "quartz/plugins/vfile.ts",
  ],
  Component: [
    "quartz/components/index.ts",
    "quartz/components/types.ts",
    "quartz/components/registry.ts",
    "quartz/components/external.ts",
  ],
  Loader: ["quartz/plugins/loader/"],
  Condition: ["quartz/plugins/loader/conditions.ts"],
  Frame: ["quartz/components/frames/"],
}

/** The exports the site's steering files use, or will: always named in the report. */
export const WATCHED = ["registerCondition", "loadQuartzLayout"]

const text = (files, rel) => files.get(rel)?.content?.toString("utf-8") ?? null
const show = (value) => JSON.stringify(value)
const equal = (a, b) => show(a) === show(b)
const nothing = (why) => [`Nothing to report: ${why}.`]

// --- Diffs of keyed values ----------------------------------------------------------------------

/**
 * Compare two Maps of key → value. Returns `{ added, removed, renamed, changed }`, where a removed
 * and an added key are paired as renamed when `pair(removedKey, addedKey)` says so (at most one
 * pairing each).
 */
function compareMaps(before, after, pair) {
  const removed = [...before.keys()].filter((key) => !after.has(key))
  let added = [...after.keys()].filter((key) => !before.has(key))
  const renamed = []
  const stillRemoved = []
  for (const key of removed) {
    const candidates = added.filter((other) => pair(key, other))
    if (candidates.length === 1) {
      renamed.push([key, candidates[0]])
      added = added.filter((other) => other !== candidates[0])
    } else stillRemoved.push(key)
  }
  const changed = [...before.keys()].filter(
    (key) => after.has(key) && !equal(before.get(key), after.get(key)),
  )
  return { added, removed: stillRemoved, renamed, changed }
}

// The leaf values of a YAML/JSON value by dotted path. Arrays are leaves: a list is one option.
function leaves(value, prefix = "", out = new Map()) {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) {
    for (const [key, child] of Object.entries(value))
      leaves(child, prefix ? `${prefix}.${key}` : key, out)
  } else if (prefix) out.set(prefix, value)
  return out
}

const parent = (key) => key.split(".").slice(0, -1).join(".")
// A renamed key: the same place and the same value under another name.
const renamedKey = (before, after) => (a, b) =>
  parent(a) === parent(b) && equal(before.get(a), after.get(b))

// --- 1. The default config ----------------------------------------------------------------------

// A plugin source's package, whatever form the source takes: `github:owner/name#ref`,
// `@scope/name` or `name`.
const pluginName = (source) =>
  String(source)
    .replace(/#.*$/, "")
    .replace(/\.git$/, "")
    .split(/[/:]/)
    .at(-1)

function defaultConfigSection(base, next) {
  const [before, after] = [text(base, DEFAULT_CONFIG), text(next, DEFAULT_CONFIG)]
  if (before === null && after === null) return nothing("neither ref has a default config")
  if (after === null) return ["The target has no default config any more."]
  if (before === null) return ["The target adds a default config; the pinned ref had none."]
  let a, b
  try {
    ;[a, b] = [parseYaml(before) ?? {}, parseYaml(after) ?? {}]
  } catch (err) {
    return [`Could not read the default config: ${err.message.split("\n")[0]}`]
  }
  const out = []

  // Everything but the plugins list, by key.
  const rest = (doc) =>
    leaves(Object.fromEntries(Object.entries(doc).filter(([key]) => key !== "plugins")))
  const [ra, rb] = [rest(a), rest(b)]
  const keys = compareMaps(ra, rb, renamedKey(ra, rb))
  keys.removed.forEach((key) => out.push(`${key}: removed`))
  keys.added.forEach((key) => out.push(`${key}: added`))
  keys.renamed.forEach(([from, to]) => out.push(`${from} → ${to}: renamed`))

  // The plugins, by source; a plugin whose package keeps its name under another source is renamed.
  const plugins = (doc) =>
    new Map(
      (Array.isArray(doc.plugins) ? doc.plugins : []).map((entry) => [
        String(entry?.source),
        entry ?? {},
      ]),
    )
  const [pa, pb] = [plugins(a), plugins(b)]
  const diff = compareMaps(pa, pb, (x, y) => pluginName(x) === pluginName(y))
  diff.removed.forEach((source) => out.push(`plugin ${source}: removed`))
  diff.added.forEach((source) => out.push(`plugin ${source}: added`))
  diff.renamed.forEach(([from, to]) => out.push(`plugin ${from} → ${to}: renamed`))

  // Each plugin both refs have: its keys (options, layout, order) and whether it is on by default.
  const both = [
    ...diff.renamed,
    ...[...pa.keys()].filter((source) => pb.has(source)).map((source) => [source, source]),
  ]
  for (const [from, to] of both) {
    const strip = ({ source, enabled, ...entry }) => leaves(entry)
    const [ea, eb] = [strip(pa.get(from)), strip(pb.get(to))]
    const entry = compareMaps(ea, eb, renamedKey(ea, eb))
    entry.removed.forEach((key) => out.push(`plugin ${to}: ${key} removed`))
    entry.added.forEach((key) => out.push(`plugin ${to}: ${key} added`))
    entry.renamed.forEach(([x, y]) => out.push(`plugin ${to}: ${x} → ${y} renamed`))
    const [on, now] = [pa.get(from).enabled, pb.get(to).enabled]
    if (on !== now) out.push(`plugin ${to}: enabled ${on ?? "(unset)"} → ${now ?? "(unset)"}`)
  }
  return out.length ? out : nothing("no plugin or option key was added, removed or renamed")
}

// --- 2. The plugin config schema ----------------------------------------------------------------

// A schema's shape by path: each place a value can go, with what constrains it there.
function schemaShape(schema, where = "", out = new Map()) {
  if (!schema || typeof schema !== "object") return out
  const {
    properties,
    items,
    additionalProperties,
    oneOf,
    anyOf,
    description,
    title,
    default: _,
    examples,
    $schema,
    $id,
    $comment,
    ...own
  } = schema
  out.set(
    where || "(root)",
    typeof additionalProperties === "boolean" ? { ...own, additionalProperties } : own,
  )
  for (const [key, child] of Object.entries(properties ?? {}))
    schemaShape(child, where ? `${where}.${key}` : key, out)
  if (items) schemaShape(items, `${where}[]`, out)
  if (additionalProperties && typeof additionalProperties === "object")
    schemaShape(additionalProperties, `${where}.*`, out)
  ;[...(oneOf ?? []), ...(anyOf ?? [])].forEach((alt, i) =>
    schemaShape(alt, `${where} (alternative ${i + 1})`, out),
  )
  return out
}

function schemaSection(base, next, ours) {
  const out = []
  const [before, after] = [text(base, SCHEMA_REL), text(next, SCHEMA_REL)]
  if (after === null)
    return [`The target has no ${SCHEMA_REL}: our site config cannot be checked against it.`]
  let schema
  try {
    schema = JSON.parse(after)
  } catch (err) {
    return [`The target's schema is not valid JSON: ${err.message}`]
  }
  if (before === null) out.push("The schema is new at the target.")
  else if (before !== after) {
    const [a, b] = [schemaShape(JSON.parse(before)), schemaShape(schema)]
    const diff = compareMaps(a, b, () => false)
    diff.removed.forEach((key) => out.push(`${key}: removed`))
    diff.added.forEach((key) => out.push(`${key}: added`))
    for (const key of diff.changed) {
      for (const keyword of new Set([...Object.keys(a.get(key)), ...Object.keys(b.get(key))])) {
        const [x, y] = [a.get(key)[keyword], b.get(key)[keyword]]
        if (!equal(x, y))
          out.push(
            `${key}: ${keyword} ${x === undefined ? "(none)" : show(x)} → ${y === undefined ? "(none)" : show(y)}`,
          )
      }
    }
    if (!out.length) out.push("The schema's text changed, but no constraint did.")
  }
  if (!out.length) out.push(...nothing("the schema is unchanged"))

  const config = text(ours, SITE_CONFIG)
  if (config === null) out.push(`Core has no site config (${SITE_CONFIG}) to check.`)
  else {
    const errors = validateSiteConfig(config, schema)
    if (!errors.length) out.push("Our site config validates against the target's schema.")
    else {
      out.push(`Our site config against the target's schema: ${errors.length} error(s).`)
      errors.forEach((error) => out.push(`  ${formatError(error)}`))
    }
  }
  out.push(...amendSchema(schema).notes)
  return out
}

// --- 3. The quartz.ts template ------------------------------------------------------------------

/**
 * `diff -u` of two versions of the upstream file `label`, the pinned ref's (`a`) and the target's
 * (`b`), as lines. Either may be null (no such file). The upgrade's steering-files step uses it too.
 */
export function unifiedDiff(label, a, b) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quartz-report-diff-"))
  try {
    fs.writeFileSync(path.join(dir, "a"), a ?? "")
    fs.writeFileSync(path.join(dir, "b"), b ?? "")
    const res = spawnSync(
      "diff",
      [
        "-u",
        "--label",
        `upstream (pinned)/${label}`,
        "--label",
        `upstream (target)/${label}`,
        "a",
        "b",
      ],
      { cwd: dir, encoding: "utf-8" },
    )
    return res.stdout.replace(/\n$/, "").split("\n")
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function templateSection(base, next) {
  const [before, after] = [text(base, TEMPLATE), text(next, TEMPLATE)]
  if (before === after) return nothing("upstream's quartz.ts template is unchanged")
  return [
    "Upstream's template changed; our quartz.ts is a steering file, so merge what you want by hand:",
    ...unifiedDiff(TEMPLATE, before, after).map((line) => `  ${line}`),
  ]
}

// --- 4. Exported APIs ---------------------------------------------------------------------------

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
const squash = (s) =>
  s.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").replace(/,\)/g, ")").trim()
// A declaration's lines, each with its whitespace collapsed, blank lines dropped.
const tidy = (s) =>
  s
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
const balanced = (s) => {
  const count = (re) => (s.match(re) ?? []).length
  const angles = s.replace(/=>/g, "")
  return (
    count(/\(/g) === count(/\)/g) &&
    count(/\[/g) === count(/\]/g) &&
    (angles.match(/</g) ?? []).length === (angles.match(/>/g) ?? []).length
  )
}

/**
 * The exports of one TypeScript module, as a Map of name → its signature: a function's parameters
 * and return type (not its body), a type's or interface's whole declaration, a class's header and
 * its non-private members, a constant's name and type, and a re-export's source.
 */
export function exportsOf(source) {
  const all = stripComments(source).split("\n")
  const out = new Map()
  for (let i = 0; i < all.length; i++) {
    const line = all[i]
    if (!line.startsWith("export ")) continue
    // The whole statement: its first line, and the lines after it that continue it.
    let end = i + 1
    while (end < all.length && (all[end] === "" || /^[\s})\]>|&]/.test(all[end]))) end++
    const stmt = all.slice(i, end)
    while (stmt.length > 1 && stmt.at(-1).trim() === "") stmt.pop()
    const joined = stmt.join("\n")

    let m
    if ((m = joined.match(/^export \* as (\w+) from ["']([^"']+)["']/)))
      out.set(m[1], `* as ${m[1]} from "${m[2]}"`)
    else if ((m = joined.match(/^export \* from ["']([^"']+)["']/)))
      out.set(`* from "${m[1]}"`, `* from "${m[1]}"`)
    else if ((m = joined.match(/^export (type )?\{([^}]*)\}(?:\s*from\s*["']([^"']+)["'])?/))) {
      for (const part of m[2]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)) {
        const [name, alias] = part.replace(/^type /, "").split(/\s+as\s+/)
        out.set(
          alias ?? name,
          m[3] ? `${m[1] ?? ""}${name} from "${m[3]}"` : `${m[1] ?? ""}${name}`,
        )
      }
    } else if ((m = joined.match(/^export (?:declare )?(?:async )?function\*? (\w+)/))) {
      // The signature: up to the line that opens the body, with everything balanced before it.
      const sig = []
      for (const l of stmt) {
        sig.push(l)
        const soFar = sig.join("\n")
        if (/\{\s*$/.test(l) && balanced(soFar.replace(/\{\s*$/, ""))) break
      }
      const prior = out.get(m[1])
      const now = tidy(sig.join("\n").replace(/\{\s*$/, ""))
      out.set(m[1], prior ? `${prior}\n${now}` : now) // overloads
    } else if ((m = joined.match(/^export (?:default )?(?:abstract )?class (\w+)/))) {
      const members = stmt
        .slice(1)
        .filter((l) => /^ {2}(?! )/.test(l) && !/^ {2}(private|#|\}|\))/.test(l))
      out.set(m[1], tidy([stmt[0], ...members.map((l) => l.replace(/\{\s*$/, ""))].join("\n")))
    } else if ((m = joined.match(/^export (?:declare )?(?:const|let|var) (\w+)(\s*:[^=]+)?/))) {
      out.set(m[1], squash(`const ${m[1]}${m[2] ?? ""}`))
    } else if (
      (m = joined.match(/^export (?:declare )?(?:interface|type|enum|const enum) (\w+)/))
    ) {
      out.set(m[1], tidy(joined))
    } else if (joined.startsWith("export default")) {
      out.set("default", squash(stmt[0]))
    }
  }
  return out
}

// The keys of a top-level object literal `const <name> ... = {`: a module's built-in registry.
function registryKeys(source, name) {
  const all = stripComments(source ?? "").split("\n")
  const start = all.findIndex((l) =>
    new RegExp(`^(export )?const ${name}\\b.*=\\s*\\{\\s*$`).test(l),
  )
  if (start === -1) return null
  const keys = []
  for (const l of all.slice(start + 1)) {
    if (/^\}/.test(l)) break
    const m = l.match(/^ {2}(?:"([^"]+)"|'([^']+)'|([\w$-]+))\s*:/)
    if (m) keys.push(m[1] ?? m[2] ?? m[3])
  }
  return keys
}

const inKind = (rel, entries) =>
  /\.tsx?$/.test(rel) &&
  !/\.test\.tsx?$/.test(rel) &&
  entries.some((entry) =>
    entry.endsWith("/")
      ? rel.startsWith(entry) && !rel.slice(entry.length).includes("/")
      : rel === entry,
  )

// Every export of a kind, keyed `name (file)`, with the files it was found in.
function kindExports(files, entries, exclude = []) {
  const out = new Map()
  for (const rel of [...files.keys()]
    .filter((rel) => inKind(rel, entries) && !exclude.includes(rel))
    .sort()) {
    for (const [name, sig] of exportsOf(text(files, rel))) out.set(`${name} (${rel})`, sig)
  }
  return out
}

// Built-in registries a kind has: conditions and frames, by the object literal that holds them.
const BUILTINS = {
  Condition: {
    what: "built-in condition",
    file: "quartz/plugins/loader/conditions.ts",
    name: "builtinConditions",
  },
  Frame: {
    what: "built-in frame",
    file: "quartz/components/frames/index.ts",
    name: "builtinFrames",
  },
}

// The names our steering file quartz.ts imports from Core source: `{ name, binds, from }`, where
// `name` is the local name and `binds` the export it binds ("default" for a default import, null
// for a namespace import, which binds no one name, so only its module is checked).
function steeringImports(ours) {
  const source = stripComments(text(ours, TEMPLATE) ?? "")
  const out = []
  for (const m of source.matchAll(/import\s+([^;'"]*?)\s*from\s*["'](\.\/quartz\/[^"']+)["']/g)) {
    const clause = m[1].replace(/^type\s+/, "")
    const named = clause.match(/\{([^}]*)\}/)
    const first = clause
      .replace(/\{[^}]*\}/, "")
      .replace(/,/g, " ")
      .trim()
    if (/^[\w$]+$/.test(first)) out.push({ name: first, binds: "default", from: m[2] })
    else if (first) out.push({ name: first, binds: null, from: m[2] })
    for (const part of (named?.[1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      const [binds, alias] = part.replace(/^type /, "").split(/\s+as\s+/)
      out.push({ name: alias ?? binds, binds, from: m[2] })
    }
  }
  return out
}

const MODULE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"]

// The file a module specifier imported from `fromFile` names in `files`, or null.
function resolveModule(files, fromFile, spec) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec))
  return MODULE_EXTENSIONS.map((ext) => base + ext).find((rel) => files.has(rel)) ?? null
}

const moduleExists = (files, spec) => resolveModule(files, TEMPLATE, spec) !== null

/**
 * Where the export `name` of module `file` is declared, following re-exports (`export { x } from`,
 * `export * from`): `{ file, sig }`, or null if the module does not export it.
 */
function declarationOf(files, file, name, seen = new Set()) {
  if (file === null || seen.has(`${file}#${name}`)) return null
  seen.add(`${file}#${name}`)
  const exports = exportsOf(text(files, file) ?? "")
  const sig = exports.get(name)
  if (sig !== undefined) {
    const reexport = sig.match(/^(?:type )?([\w$]+) from "([^"]+)"$/)
    return reexport
      ? declarationOf(files, resolveModule(files, file, reexport[2]), reexport[1], seen)
      : { file, sig }
  }
  for (const key of exports.keys()) {
    const star = key.match(/^\* from "([^"]+)"$/)
    const found = star && declarationOf(files, resolveModule(files, file, star[1]), name, seen)
    if (found) return found
  }
  return null
}

// How a declaration changed: the lines only one side has, or, for a one-line declaration, both.
function change(before, after) {
  const [la, lb] = [before.split("\n"), after.split("\n")]
  const [minus, plus] = [la.filter((l) => !lb.includes(l)), lb.filter((l) => !la.includes(l))]
  if (la.length > 1 && lb.length > 1 && minus.length + plus.length)
    return [...minus.map((l) => `  - ${l}`), ...plus.map((l) => `  + ${l}`)]
  return [`  - ${squash(before)}`, `  + ${squash(after)}`]
}

function exportsSection(base, next, ours) {
  const out = []
  const status = new Map() // name → "added" | "removed" | "changed" | "moved from … to …"
  for (const [kind, entries] of Object.entries(API_FILES)) {
    // Conditions live in the loader's directory, but are their own kind.
    const exclude = kind === "Loader" ? API_FILES.Condition : []
    const [a, b] = [kindExports(base, entries, exclude), kindExports(next, entries, exclude)]
    const bare = (key) => key.replace(/ \(.*\)$/, "")
    // Compared with whitespace squashed, so a re-wrapped declaration is not a change.
    const flat = (m) => new Map([...m].map(([key, sig]) => [key, squash(sig)]))
    const [fa, fb] = [flat(a), flat(b)]
    const diff = compareMaps(fa, fb, (x, y) => bare(x) === bare(y) && fa.get(x) === fb.get(y))
    const lines = []
    diff.removed.forEach((key) => lines.push(`${key}: removed`))
    diff.added.forEach((key) => lines.push(`${key}: added`))
    diff.renamed.forEach(([from, to]) =>
      lines.push(
        `${bare(from)}: moved from ${from.match(/\((.*)\)$/)[1]} to ${to.match(/\((.*)\)$/)[1]}`,
      ),
    )
    for (const key of diff.changed) lines.push(`${key}: changed`, ...change(a.get(key), b.get(key)))
    diff.removed.forEach((key) => status.set(bare(key), "removed"))
    diff.added.forEach((key) => status.set(bare(key), status.has(bare(key)) ? "moved" : "added"))
    diff.changed.forEach((key) => status.set(bare(key), "changed"))
    diff.renamed.forEach(([from, to]) =>
      status.set(
        bare(from),
        `moved from ${from.match(/\((.*)\)$/)[1]} to ${to.match(/\((.*)\)$/)[1]}`,
      ),
    )
    const builtin = BUILTINS[kind]
    if (builtin) {
      const [ka, kb] = [
        registryKeys(text(base, builtin.file), builtin.name),
        registryKeys(text(next, builtin.file), builtin.name),
      ]
      if (ka && !kb)
        lines.push(`the ${builtin.what}s (${builtin.name} in ${builtin.file}) are no longer found`)
      if (ka && kb) {
        ka.filter((key) => !kb.includes(key)).forEach((key) =>
          lines.push(`${builtin.what} ${key}: removed`),
        )
        kb.filter((key) => !ka.includes(key)).forEach((key) =>
          lines.push(`${builtin.what} ${key}: added`),
        )
      }
    }
    if (lines.length) out.push(`${kind} API:`, ...lines.map((line) => `  ${line}`))
    else out.push(`${kind} API: nothing to report.`)
  }

  // What the site's steering files use, and what they will: registerCondition and loadQuartzLayout.
  // A name quartz.ts imports is looked up in the module it imports it from, wherever in Core source
  // that is, following re-exports; a watched name it does not import, among the API kinds.
  out.push("", "The site's steering files:")
  const imports = steeringImports(ours)
  const exported = (files, name) =>
    Object.values(API_FILES).some((entries) =>
      [...kindExports(files, entries).keys()].some((key) => key.startsWith(`${name} (`)),
    )
  for (const name of WATCHED.filter((name) => !imports.some((i) => i.binds === name))) {
    const now =
      status.get(name) ??
      (exported(next, name)
        ? "unchanged"
        : exported(base, name)
          ? "removed"
          : "not exported at either ref")
    out.push(`  ${name}: ${now}`)
  }
  const inApi = (file) => Object.values(API_FILES).some((entries) => inKind(file, entries))
  const broken = []
  for (const { name, binds, from } of imports) {
    if (!moduleExists(next, from)) {
      broken.push(`  quartz.ts imports ${name} from ${from}, which the target no longer has`)
      continue
    }
    if (binds === null) continue
    const [was, now] = [base, next].map((files) =>
      declarationOf(files, resolveModule(files, TEMPLATE, from), binds),
    )
    let state
    let detail = []
    if (!now) {
      state = was ? "removed" : "not exported at either ref"
      broken.push(`  quartz.ts imports ${name} from ${from}, which no longer exports it`)
    } else if (!was) state = "added"
    else if (squash(was.sig) !== squash(now.sig)) {
      state = "changed"
      // A declaration in an API kind has its change listed above, under its kind.
      if (!inApi(now.file)) detail = change(was.sig, now.sig).map((line) => `  ${line}`)
    } else state = was.file === now.file ? "unchanged" : `moved from ${was.file} to ${now.file}`
    out.push(`  ${name}: ${state}, and quartz.ts uses it`, ...detail)
  }
  out.push(...broken)
  return out
}

// --- 5. Core's package.json ---------------------------------------------------------------------

const FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "engines",
]

function packageSection(base, next) {
  const parse = (files) => JSON.parse(text(files, "package.json") ?? "{}")
  const [a, b] = [parse(base), parse(next)]
  const out = []
  if (a.version !== b.version) out.push(`version: ${a.version} → ${b.version}`)
  for (const field of FIELDS) {
    const [x, y] = [a[field] ?? {}, b[field] ?? {}]
    for (const name of [...new Set([...Object.keys(x), ...Object.keys(y)])].sort()) {
      if (!(name in y)) out.push(`${field}.${name}: removed (was ${x[name]})`)
      else if (!(name in x)) out.push(`${field}.${name}: added (${y[name]})`)
      else if (x[name] !== y[name]) out.push(`${field}.${name}: ${x[name]} → ${y[name]}`)
    }
  }
  return out.length ? out : nothing("no dependency or engine changed")
}

// --- 6. Our packages' peer ranges ---------------------------------------------------------------

// A version as [major, minor, patch, prerelease].
const parseVersion = (v) => {
  const m = String(v)
    .trim()
    .replace(/^[=v]+/, "")
    .match(/^(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:-([\w.-]+))?(?:\+[\w.-]+)?$/)
  if (!m) return null
  const part = (p) => (p === undefined || p === "x" || p === "*" ? null : Number(p))
  return [Number(m[1]), part(m[2]), part(m[3]), m[4] ?? null]
}
const cmp = (a, b) => {
  for (let i = 0; i < 3; i++)
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0) ? -1 : 1
  if (a[3] === b[3]) return 0
  return a[3] === null ? 1 : b[3] === null ? -1 : a[3] < b[3] ? -1 : 1
}

/**
 * Whether `version` satisfies the npm range `range`: `*`, `x`, exact versions, `^`, `~`, the
 * comparators `<`, `<=`, `>`, `>=`, `=`, partial versions, space-separated conjunctions and `||`.
 * Returns null for a range it cannot read.
 */
export function satisfies(version, range) {
  const v = parseVersion(version)
  if (!v) return null
  let unreadable = false
  const one = (comparator) => {
    const m = comparator.match(/^(\^|~|>=|<=|>|<|=)?\s*(.+)$/)
    if (!m) return (unreadable = true)
    if (["*", "x", "X", ""].includes(m[2])) return v[3] === null
    const r = parseVersion(m[2])
    if (!r) return (unreadable = true)
    const [maj, min, pat] = r
    const lo = [maj, min ?? 0, pat ?? 0, r[3]]
    // The upper bound (exclusive) of a partial or caret/tilde range.
    const upper = () => {
      if (m[1] === "^")
        return maj > 0 || min === null
          ? [maj + 1, 0, 0, "0"]
          : min > 0 || pat === null
            ? [0, min + 1, 0, "0"]
            : [0, 0, pat + 1, "0"]
      if (m[1] === "~") return min === null ? [maj + 1, 0, 0, "0"] : [maj, min + 1, 0, "0"]
      return min === null ? [maj + 1, 0, 0, "0"] : pat === null ? [maj, min + 1, 0, "0"] : null
    }
    if (v[3] !== null && !(v[0] === lo[0] && v[1] === lo[1] && v[2] === lo[2] && lo[3] !== null))
      return false // prereleases only match their own
    switch (m[1]) {
      case ">=":
        return cmp(v, lo) >= 0
      case ">":
        return min === null
          ? cmp(v, [maj + 1, 0, 0, "0"]) >= 0
          : pat === null
            ? cmp(v, [maj, min + 1, 0, "0"]) >= 0
            : cmp(v, lo) > 0
      case "<":
        return cmp(v, lo) < 0
      case "<=":
        return upper() ? cmp(v, upper()) < 0 : cmp(v, lo) <= 0
      default: {
        const hi = upper()
        return hi ? cmp(v, lo) >= 0 && cmp(v, hi) < 0 : cmp(v, lo) === 0
      }
    }
  }
  const result = range
    .split("||")
    .map((alt) => alt.trim().replace(/(\^|~|>=|<=|>|<|=)\s+/g, "$1"))
    .some((alt) => {
      const hyphen = alt.match(/^(\S+)\s+-\s+(\S+)$/)
      const comparators = hyphen ? [`>=${hyphen[1]}`, `<=${hyphen[2]}`] : alt.split(/\s+/)
      return comparators.every(one)
    })
  return unreadable ? null : result
}

// The version of each package at Core's top level, from an npm lock: what a plugin's peer resolves to.
function coreVersions(files) {
  const lock = text(files, "package-lock.json")
  if (lock === null) return null
  const out = new Map()
  for (const [key, entry] of Object.entries(JSON.parse(lock).packages ?? {})) {
    const m = key.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)$/)
    if (m && entry.version) out.set(m[1], entry.version)
  }
  return out
}

function peersSection(base, next, siteRoot) {
  const [before, after] = [coreVersions(base), coreVersions(next)]
  if (after === null)
    return ["The target has no package-lock.json, so Core's versions are unknown."]
  const packages = (workspacePackages(siteRoot) ?? [])
    .map(({ pkg }) => pkg)
    .filter((pkg) => Object.keys(pkg.peerDependencies ?? {}).length)
  if (!packages.length) return nothing("no package of ours declares a peer")
  const out = []
  let checked = 0
  for (const pkg of packages) {
    for (const [dep, range] of Object.entries(pkg.peerDependencies)) {
      checked++
      const version = after.get(dep)
      const was = before?.get(dep)
      const already = (ok) => (ok ? "" : " (already so at the pinned ref)")
      if (version === undefined) {
        out.push(
          `${pkg.name}: ${dep} ${range} is not provided by the target's Core at all${already(was !== undefined)}`,
        )
        continue
      }
      const ok = satisfies(version, range)
      if (ok === null)
        out.push(
          `${pkg.name}: ${dep} ${range} is a range this report cannot read; check it against Core's ${version} by hand`,
        )
      else if (!ok)
        out.push(
          `${pkg.name}: ${dep} ${range} is not satisfied by Core's ${version}${already(was !== undefined && satisfies(was, range))}`,
        )
    }
  }
  return out.length
    ? out
    : nothing(
        `Core's versions satisfy all ${checked} peer range(s) of our ${packages.length} package(s)`,
      )
}

// --- The report ---------------------------------------------------------------------------------

/**
 * The report, as `[{ title, lines }]`, one section per category. `base` and `next` are the pinned
 * and target trees, `ours` is Core on disk, and `siteRoot` the site repo, whose workspace packages'
 * peer ranges are checked.
 */
export function apiReport({ base, next, ours, siteRoot }) {
  // The report is informational, so a category that cannot read its inputs (a file that does not
  // parse) says so, and the other categories still report.
  const section = (title, lines) => {
    try {
      return { title, lines: lines() }
    } catch (err) {
      return {
        title,
        lines: [`Could not read this category's inputs: ${err.message.split("\n")[0]}`],
      }
    }
  }
  return [
    section(
      `The default config (${DEFAULT_CONFIG}, pruned from Core: read from the upstream cache)`,
      () => defaultConfigSection(base, next),
    ),
    section(
      `The plugin config schema (${SCHEMA_REL}), and our site config against the target's`,
      () => schemaSection(base, next, ours),
    ),
    section(`The ${TEMPLATE} template`, () => templateSection(base, next)),
    section("Exported APIs: plugin, component, loader, condition and frame", () =>
      exportsSection(base, next, ours),
    ),
    section("Core's package.json: dependencies and engines", () => packageSection(base, next)),
    section("Our packages' peer ranges against the target's Core", () =>
      peersSection(base, next, siteRoot),
    ),
  ]
}

/** The report as lines to print, each section's lines indented under its title. */
export const formatReport = (sections) =>
  sections.flatMap(({ title, lines }, i) => [
    ...(i ? [""] : []),
    title,
    ...lines.map((line) => (line ? `  ${line}` : "")),
  ])
