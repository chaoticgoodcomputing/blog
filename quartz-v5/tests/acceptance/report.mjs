#!/usr/bin/env node
// The real-site acceptance report: the second seam in tests/CONTEXT.md. Builds the real vault
// (`content/public`) under v4 and under v5, compares what the two sites serve, and prints every
// difference: in the emitted URL set, in sitemap and RSS membership, and in each page's head
// metadata (noindex, canonical, article:*, JSON-LD). It also runs site-styles' cascade-layer guard on
// the v5 build (cascade.mjs, #64). Differences a decision expects are on the allowlist
// (allowlist.mjs), each citing its ticket. Any other difference fails the run.
//
// Judgement calls (#62): v4 is built with its inner targets, since `site:build` runs `vault:sync`,
// which rewrites the vault. Quartz's generated files (read.mjs, `kindOf`) are counted, not compared.
// On a case-insensitive filesystem the case redirects #23 relies on cannot exist, so a lowercased
// page is allowed there unverified, and the run exits 3 rather than pass without having seen them;
// CI's Linux checks them. A move allowed by an entry that needs no redirect (#48's /widgets/README)
// is not waiting on one.
//
// Run it through Nx: `pnpm nx run site-v5-e2e:acceptance`. Options:
//   --skip-build     compare the sites already built at the default locations
//   --v4 <dir>       compare this built v4 site instead (implies --skip-build); default dist/public
//   --v5 <dir>       compare this built v5 site instead (implies --skip-build); default quartz-v5/quartz/public
//   --vault <dir>    the content both sites were built from, which some allowlist entries consult;
//                    default content/public
//   --origin <url>   the site's origin; default https:// + the site config's baseUrl
//   --out <dir>      where report.txt and report.json go; default dist/acceptance
//   --full           print every difference, not a few of each kind
//   --allow-unverified-redirects
//                    pass on a case-insensitive filesystem (macOS by default) although the case
//                    redirects could not be checked there; for local runs only, never the cutover gate
// Relative paths are read from the repo root, where the defaults are, whatever directory the report
// runs in (Nx runs it in quartz-v5/tests).
// Exits 0 when every difference is allowed, 1 when any is not, 2 when it cannot run, and 3 when every
// difference is allowed but some case redirects went unchecked (see --allow-unverified-redirects).
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { readSite, isCaseSensitive } from "./read.mjs"
import { compare } from "./compare.mjs"
import { checkCascade } from "./cascade.mjs"
import { ALLOWLIST, PENDING, checkAllowlist } from "./allowlist.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, "../../..")
const siteConfigFile = path.join(repoRoot, "quartz-v5/quartz.config.yaml")
const EXAMPLES = 5

function parseArgs(argv) {
  const options = { build: true, full: false, allowUnverifiedRedirects: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const [flag, inline] = arg.split(/=(.*)/s)
    const value = () => inline ?? argv[++i]
    if (flag === "--skip-build") options.build = false
    else if (flag === "--full") options.full = true
    else if (flag === "--allow-unverified-redirects") options.allowUnverifiedRedirects = true
    else if (flag === "--v4" || flag === "--v5") {
      options[flag.slice(2)] = path.resolve(repoRoot, value())
      options.build = false
    } else if (flag === "--vault") options.vault = path.resolve(repoRoot, value())
    else if (flag === "--origin") options.origin = value().replace(/\/$/, "")
    else if (flag === "--out") options.out = path.resolve(repoRoot, value())
    else throw new Error(`unknown option ${arg}`)
  }
  options.v4 ??= path.join(repoRoot, "dist/public")
  options.v5 ??= path.join(repoRoot, "quartz-v5/quartz/public")
  options.out ??= path.join(repoRoot, "dist/acceptance")
  options.vault ??= path.join(repoRoot, "content/public")
  if (!fs.existsSync(options.vault)) throw new Error(`no vault at ${options.vault}`)
  options.origin ??= `https://${/^\s*baseUrl:\s*["']?([^"'\s#]+)/m.exec(fs.readFileSync(siteConfigFile, "utf8"))[1]}`
  return options
}

// The builds each site deploys, run through each site's own Nx targets so later changes to them are
// picked up. v4's `site:build` also runs `vault:sync`, which rewrites the vault, so the report runs
// its inner targets instead, after the one prebuild step that changes what v4 serves. `clock` marks
// the step that renders a site's pages, whose run is that site's build clock.
const BUILDS = [
  {
    label: "v4: fetch the annotation PDFs it serves (vault:download-annotation-pdfs, without vault:sync)",
    command: ["node", "content/utils/download-annotation-pdfs.mjs"],
    optional: true,
  },
  {
    label: "v4: build the vault into dist/public (site:_inbuild)",
    command: ["pnpm", "nx", "run", "site:_inbuild", "--concurrency=4"],
    clock: "v4",
  },
  { label: "v4: copy its root files (site:_postbuild)", command: ["pnpm", "nx", "run", "site:_postbuild"] },
  {
    label: "v5: build the vault into quartz-v5/quartz/public (site-v5:build)",
    command: ["pnpm", "nx", "run", "site-v5:build", "--concurrency=4"],
    clock: "v5",
  },
]

/** Runs the builds, and returns the span each site's pages were rendered in. */
function build() {
  const clocks = {}
  for (const { label, command, optional, clock } of BUILDS) {
    console.error(`\n▸ ${label}`)
    const from = Date.now()
    // Build logs go to stderr, so stdout carries only the report.
    const { status, error } = spawnSync(command[0], command.slice(1), { cwd: repoRoot, stdio: ["ignore", 2, 2] })
    if (clock) clocks[clock] = { from, to: Date.now() }
    if (status === 0) continue
    const why = error ? error.message : `exit ${status}`
    if (!optional) throw new Error(`${label} failed (${why})`)
    console.error(`  (skipped: ${why})`)
  }
  return clocks
}

// What the report read from a site's pages, so a run that read nothing can't pass unnoticed.
function summarize(site) {
  const count = (kind) => [...site.urls.values()].filter((entry) => entry.kind === kind).length
  const having = (test) => [...site.pages.values()].filter(({ fields }) => test(fields)).length
  return {
    root: site.root,
    urls: site.urls.size - count("generated"),
    pages: count("page"),
    generated: count("generated"),
    sitemap: site.sitemap?.size ?? null,
    rss: site.rss?.size ?? null,
    heads: {
      canonical: having((fields) => fields.has("canonical")),
      noindex: having((fields) => fields.get("robots")?.includes("noindex")),
      article: having((fields) => [...fields.keys()].some((field) => field.startsWith("article:"))),
      jsonld: having((fields) => [...fields.keys()].some((field) => field.startsWith("jsonld"))),
    },
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`
const clip = (value) => (value.length > 110 ? `${value.slice(0, 107)}...` : value)

// Differences that read as one line in the report: same area, change, kind and field.
function groupOf(d) {
  if (d.area === "url") {
    const things = d.kind === "page" ? "pages" : "files"
    if (d.change === "removed") return `${things} v5 no longer serves`
    if (d.change === "added") return `${things} only v5 serves`
    // A move allowed without a redirect (#48) waits on none, so its redirect goes unsaid.
    if (!d.redirect || (d.allowedBy && !d.allowedBy.needsRedirect)) return `${things} moved (${d.how.join(", ")})`
    const redirect = d.redirect === "unverifiable" ? "redirects unverifiable here" : `redirect ${d.redirect}`
    return `${things} moved (${d.how.join(", ")}, ${redirect})`
  }
  if (d.area === "sitemap" || d.area === "rss") {
    const what = d.area === "sitemap" ? "sitemap entries" : "RSS items"
    return d.change === "removed" ? `${what} v5 drops` : `${what} only v5 lists`
  }
  if (d.area === "layers") return "v5 stylesheet sets whose cascade layers don't rank as the site's stack declares"
  const change = d.removed.length && d.added.length ? "changed" : d.removed.length ? "removed" : "added"
  return `pages whose ${d.field} v5 ${change}`
}
function lineOf(d) {
  if (d.area === "layers") {
    const declared = d.declared ? d.declared.join(", ") : "no stack declaration"
    return clip(`${d.url} (${plural(d.pages, "page")}): declared ${declared} · ranked ${d.ranked.join(", ") || "nothing"}`)
  }
  if (d.area === "head") {
    const values = [...d.removed.map((v) => `−${JSON.stringify(v)}`), ...d.added.map((v) => `+${JSON.stringify(v)}`)].join(" ")
    return clip(`${d.url}${d.to && d.to !== d.url ? ` (v5 ${d.to})` : ""}  ${values}`)
  }
  if (!d.to) return d.url
  return d.change === "removed" ? `${d.url} (nor at ${d.to})` : `${d.url} → ${d.to}`
}
function printGroups(differences, full, out) {
  const groups = new Map()
  for (const d of differences) groups.set(groupOf(d), [...(groups.get(groupOf(d)) ?? []), d])
  for (const [title, members] of groups) {
    out(`      ${String(members.length).padStart(4)}  ${title}`)
    const shown = full ? members : members.slice(0, EXAMPLES)
    for (const d of shown) out(`              ${lineOf(d)}`)
    if (shown.length < members.length) out(`              … and ${members.length - shown.length} more`)
  }
}

// The run's verdict: `fail` while any difference is off the allowlist. With all of them on it,
// `unverified` when some were allowed on a case redirect this filesystem cannot hold (#23), so no
// redirect was seen, unless the run was told to accept that. Otherwise `pass`.
const EXIT_CODES = { pass: 0, fail: 1, unverified: 3 }
const unverifiedRedirects = (differences) =>
  differences.filter((d) => d.redirect === "unverifiable" && d.allowedBy?.needsRedirect).length
function verdictOf({ options, differences }) {
  if (differences.some((d) => !d.allowedBy)) return "fail"
  return unverifiedRedirects(differences) && !options.allowUnverifiedRedirects ? "unverified" : "pass"
}

function render(result, full) {
  const { options, sites, caseSensitive, differences, used, pairs } = result
  const lines = []
  const out = (line = "") => lines.push(line)
  const relative = (dir) => {
    const inRepo = path.relative(repoRoot, dir)
    return inRepo.startsWith("..") || path.isAbsolute(inRepo) ? dir : inRepo
  }
  out("Real-site acceptance: v4 → v5")
  for (const side of ["v4", "v5"]) {
    const s = sites[side]
    const feeds = `sitemap ${s.sitemap ?? "missing"} · RSS ${s.rss ?? "missing"}`
    out(`  ${side}  ${relative(s.root)}: ${plural(s.urls, "URL")} (${plural(s.pages, "page")}) · ${feeds}`)
    out(`      heads read: canonical ${s.heads.canonical} · noindex ${s.heads.noindex} · article:* ${s.heads.article} · JSON-LD ${s.heads.jsonld}`)
  }
  out(`  Not compared: Quartz's own build output (/static/, root CSS and JS bundles, OG images), v4 ${sites.v4.generated} and v5 ${sites.v5.generated} files.`)
  out(`  Heads compared on ${plural(pairs, "pair")} of pages. Values naming a URL are compared after that URL's move, and a date`)
  out(`  each build took from its own clock counts as the same date.`)
  const { layers } = sites.v5
  out(`  v5's cascade layers checked against the site's stack declaration: ${plural(layers.pages, "page")} share`)
  out(`  ${plural(layers.sets, "set")} of stylesheets, and one page of each set was loaded.`)
  if (!caseSensitive) {
    out(`  ! The v5 site is on a case-insensitive filesystem, where alias-redirects emits no case redirects (#23),`)
    out(`    so the redirects at the old mixed-case URLs are unverified. Run on a case-sensitive one (Linux CI) to check them.`)
  }

  const allowed = differences.filter((d) => d.allowedBy)
  const failing = differences.filter((d) => !d.allowedBy)
  out()
  out(`Allowed: ${plural(allowed.length, "difference")}, each by the decision it cites`)
  for (const entry of ALLOWLIST) {
    const mine = allowed.filter((d) => d.allowedBy === entry)
    if (!mine.length) continue
    out(`  #${entry.ticket}  ${entry.summary}`)
    printGroups(mine, full, out)
  }

  out()
  out(`Not allowed: ${plural(failing.length, "difference")}`)
  for (const label of [...PENDING, undefined]) {
    const mine = failing.filter((d) => d.pending === label)
    if (!mine.length) continue
    out(label ? `  pending #${label.ticket}: ${label.summary}` : "  no ticket covers these")
    printGroups(mine, full, out)
  }

  const unused = ALLOWLIST.filter((entry) => !used.get(entry))
  if (unused.length) {
    out()
    out("Allowlist entries that matched nothing this run:")
    for (const entry of unused) out(`  #${entry.ticket}  ${clip(entry.summary)}`)
  }
  out()
  const unchecked = unverifiedRedirects(differences)
  const verdict = verdictOf(result)
  if (verdict === "fail") {
    out(`FAIL  ${plural(failing.length, "difference")} not on the allowlist. Every difference: ${relative(path.join(options.out, "report.txt"))}`)
  } else if (verdict === "unverified") {
    out(`UNVERIFIED  every difference is on the allowlist, but ${plural(unchecked, "case redirect")} could not be checked on this case-insensitive`)
    out(`  filesystem (#23). Run on a case-sensitive one, or pass --allow-unverified-redirects for a local run.`)
  } else {
    const caveat = unchecked ? ` (${plural(unchecked, "case redirect")} unverified on this filesystem, by --allow-unverified-redirects)` : ""
    out(`PASS  every difference is on the allowlist${caveat}`)
  }
  return lines.join("\n")
}

function toJson(result) {
  const { options, sites, caseSensitive, differences, used, pairs } = result
  const plain = ({ allowedBy, pending, ...d }) => ({ ...d, ...(allowedBy && { ticket: allowedBy.ticket }), ...(pending && { pending: pending.ticket }) })
  return {
    origin: options.origin,
    caseSensitive,
    sites,
    pairs,
    verdict: verdictOf(result),
    allowed: differences.filter((d) => d.allowedBy).map(plain),
    failing: differences.filter((d) => !d.allowedBy).map(plain),
    unused: ALLOWLIST.filter((entry) => !used.get(entry)).map(({ ticket, summary }) => ({ ticket, summary })),
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  checkAllowlist(ALLOWLIST)
  // A build the report ran was timed; one it didn't is dated by when its pages were written.
  const clocks = options.build ? build() : {}
  const v4 = readSite(options.v4, options.origin, { builtDuring: clocks.v4 })
  const v5 = readSite(options.v5, options.origin, { builtDuring: clocks.v5 })
  const caseSensitive = isCaseSensitive(v5)
  const cascade = await checkCascade(v5)
  const { differences, used, pairs } = compare(v4, v5, {
    allowlist: ALLOWLIST,
    pending: PENDING,
    caseSensitive,
    vault: options.vault,
    also: cascade.differences,
  })
  const sites = { v4: summarize(v4), v5: { ...summarize(v5), layers: cascade.summary } }
  const result = { options, sites, caseSensitive, differences, used, pairs }

  fs.mkdirSync(options.out, { recursive: true })
  fs.writeFileSync(path.join(options.out, "report.txt"), `${render(result, true)}\n`)
  fs.writeFileSync(path.join(options.out, "report.json"), `${JSON.stringify(toJson(result), null, 2)}\n`)
  console.log(render(result, options.full))
  return EXIT_CODES[verdictOf(result)]
}

try {
  process.exitCode = await main()
} catch (err) {
  console.error(`acceptance report: ${err.message}`)
  process.exitCode = 2
}
