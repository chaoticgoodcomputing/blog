// @chaoticgoodcomputing/css-check is ADR-0003's library-CSS check, and every styled package runs it:
// each plugin's build.mjs before it bundles, and the widgets library's lint target (whose own spec,
// libs/widgets/e2e/lint.spec.mjs, plants its escapes in widget CSS). This spec proves the library
// through the plugins, as the libs project proves every library through its consumers: an escape
// planted in a copy of a plugin fails that plugin's own build, which names what escaped.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

const pluginsRoot = path.resolve(testsRoot, "../plugins")

// Every plugin with a stylesheet of its own under src/, by its directory, with its block, which is its
// manifest name (`cgc-graph` in `quartz-graph/`), and how an escape is planted in it: inside the
// package's family sublayer where the source declares it, bare where build.mjs adds the layer.
const styled = fs
  .readdirSync(pluginsRoot)
  .map((name) => {
    const src = path.join(pluginsRoot, name, "src")
    const sheet = fs.existsSync(src)
      ? fs.readdirSync(src, { recursive: true }).find((file) => String(file).endsWith(".css"))
      : undefined
    return sheet && { name, sheet: path.join("src", String(sheet)) }
  })
  .filter(Boolean)
  .map((plugin) => {
    const layered = fs
      .readFileSync(path.join(pluginsRoot, plugin.name, plugin.sheet), "utf8")
      .match(/@layer (cgc\.[\w-]+) \{/)
    return {
      ...plugin,
      block: JSON.parse(fs.readFileSync(path.join(pluginsRoot, plugin.name, "package.json"), "utf8")).quartz.name,
      wrap: (css) => (layered ? `@layer ${layered[1]} {\n${css}\n}\n` : `${css}\n`),
    }
  })

// Builds a copy of a plugin with `css` appended to its stylesheet, and resolves with how it ended.
async function buildWith(plugin, css) {
  const root = path.join(pluginsRoot, plugin.name)
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), `${plugin.name}-css-`))
  try {
    for (const entry of ["package.json", "build.mjs", "src"])
      fs.cpSync(path.join(root, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(root, "node_modules"), path.join(copy, "node_modules"))
    fs.appendFileSync(path.join(copy, plugin.sheet), `\n${plugin.wrap(css)}`)
    const build = await promisify(execFile)("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    return { ...build, dist: fs.existsSync(path.join(copy, "dist", "index.js")) }
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
}

const plugin = (name) => styled.find((p) => p.name === name)

// The nine there are now, at least: a styled plugin added later is found and swept too.
test("every styled plugin is found", () => {
  expect(styled.map((p) => p.name)).toEqual(
    expect.arrayContaining([
      "quartz-annotator",
      "quartz-backlinks",
      "quartz-email-subscribe",
      "quartz-page-source",
      "quartz-post-listing",
      "quartz-social",
      "quartz-tag-explorer",
      "quartz-tag-list",
      "quartz-graph",
    ]),
  )
})

// A named colour was the literal every copy of the old per-package check let through, so a plugin
// whose build refuses one runs the shared check.
for (const { name, block } of styled) {
  test(`${name}'s build runs the shared check: a named colour fails it`, async () => {
    const build = await buildWith(plugin(name), `.${block} { color: white; }`)
    expect(build.code).not.toBe(0)
    expect(build.output).toMatch(/breaks ADR-0003/)
    expect(build.output).toContain("white")
    expect(build.dist).toBe(false)
  })
}

// Rules 5 and 6: skin comes from the theme, fonts from its four font families. Planted in
// quartz-page-source, the smallest styled plugin.
const SKIN = [
  ["a named colour in a shorthand", ".cgc-page-source { border: 1px solid black; }", "black"],
  [
    "a named colour in light-dark()",
    ".cgc-page-source { color: light-dark(white, black); }",
    "light-dark(white, black)",
  ],
  [
    "a literal mixed into a theme colour",
    ".cgc-page-source { color: color-mix(in srgb, var(--dark) 50%, red); }",
    "red",
  ],
  ["a system colour", ".cgc-page-source { caret-color: CanvasText; }", "CanvasText"],
  ["a hex colour", ".cgc-page-source { color: #c54040; }", "#c54040"],
  ["a colour function", ".cgc-page-source { color: oklch(60% 0.1 20); }", "oklch("],
  ["a font family in the `font` shorthand", ".cgc-page-source { font: 12px Georgia; }", "Georgia"],
  ["a font-family literal", ".cgc-page-source { font-family: Georgia, serif; }", "Georgia"],
  [
    "a literal fallback after the theme's font",
    ".cgc-page-source { font-family: var(--codeFont), monospace; }",
    "monospace",
  ],
  // A font the block names in a property of its own is still its own font.
  [
    "a font family set through the block's own property",
    '.cgc-page-source { --cgc-page-source-font: "Comic Sans MS", Georgia, serif; font-family: var(--cgc-page-source-font); }',
    "var(--cgc-page-source-font)",
  ],
  [
    "the `font` shorthand's family set through the block's own property",
    ".cgc-page-source__link { --cgc-page-source-font: Georgia, serif; font: italic 12px var(--cgc-page-source-font); }",
    "var(--cgc-page-source-font)",
  ],
  [
    "a family before the theme's font in the `font` shorthand",
    ".cgc-page-source { font: 12px Georgia var(--bodyFont); }",
    "Georgia",
  ],
  [
    "a family carried into the `font` shorthand by a var() before the theme's",
    ".cgc-page-source { --cgc-page-source-size: 12px Georgia,; font: var(--cgc-page-source-size) var(--bodyFont); }",
    "var(--cgc-page-source-size) var(--bodyFont)",
  ],
  ["a deprecated system colour", ".cgc-page-source { color: WindowText; }", "WindowText"],
  [
    "a deprecated system colour named like a property",
    ".cgc-page-source { background: Background; border-color: ButtonShadow; }",
    "Background",
  ],
]

// Rules 1, 2 and 4: a selector reaches only what the block owns, in its selector arguments too.
const REACH = [
  [
    "a sibling of the block",
    ".cgc-page-source ~ :not(.cgc-page-source) { margin: 0; }",
    "~ :not(.cgc-page-source)",
  ],
  [
    "a sibling that is not the block's",
    ".cgc-page-source__link + .cgc-page-source__icon ~ :first-child { margin: 0; }",
    "~ :first-child",
  ],
  [
    "an ancestor the block does not own",
    ":root .cgc-page-source__link { margin: 0; }",
    ":root .cgc-page-source__link",
  ],
  [
    "a condition on the block's sibling",
    ".cgc-page-source:has(~ .cgc-page-source__x, + :not(.cgc-page-source)) { margin: 0; }",
    "+ :not(.cgc-page-source)",
  ],
  [
    "an ancestor inside :is()",
    ".cgc-page-source:is(:hover .cgc-page-source) { margin: 0; }",
    ":is(:hover .cgc-page-source)",
  ],
  ["a nested rule with &", ".cgc-page-source { :root & { margin: 0; } }", ":root &"],
  [
    "a nested rule without &",
    ".cgc-page-source { .cgc-page-source__link { margin: 0; } }",
    "nested",
  ],
  [
    "a sibling filter the block doesn't own, in :nth-child()'s `of`",
    ".cgc-page-source__link:nth-child(2n of .sidebar) { margin: 0; }",
    ".sidebar",
  ],
  [
    "an ancestor inside :nth-last-child()'s `of`",
    ".cgc-page-source__link:nth-last-child(1 of :root .cgc-page-source__link) { margin: 0; }",
    ":root .cgc-page-source__link",
  ],
  ["a tag", ".cgc-page-source a { margin: 0; }", ".cgc-page-source a"],
  [
    "another package's class",
    ".cgc-page-source .cgc-social__card { margin: 0; }",
    ".cgc-social__card",
  ],
]

// Rule 7, and the page's other global namespaces: every name the stylesheet defines is the block's.
const NAMES = [
  [
    "a custom property outside the block",
    ".cgc-page-source { --cgc-link-gap: 1rem; }",
    "--cgc-link-gap",
  ],
  ["keyframes outside the block", "@keyframes spin { to { opacity: 0; } }", "spin"],
  [
    "an @property",
    "@property --cgc-page-source-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }",
    "@property",
  ],
  [
    "an @font-face",
    "@font-face { font-family: cgc-page-source-mono; src: local(Menlo); }",
    "@font-face",
  ],
  [
    "an @counter-style",
    "@counter-style cgc-page-source-list { system: cyclic; symbols: '*'; }",
    "@counter-style",
  ],
  ["an @import", "@import url(https://example.com/x.css);", "@import"],
  ["an anchor name outside the block", ".cgc-page-source { anchor-name: --menu; }", "--menu"],
  [
    "a view-transition name outside the block",
    ".cgc-page-source { view-transition-name: card; }",
    "card",
  ],
  [
    "a container name outside the block",
    ".cgc-page-source { container: sidebar / inline-size; }",
    "sidebar",
  ],
]

for (const [group, cases] of [
  ["skin", SKIN],
  ["reach", REACH],
  ["names", NAMES],
]) {
  for (const [what, css, named] of cases) {
    test(`${group}: ${what} fails the build, named`, async () => {
      const build = await buildWith(plugin("quartz-page-source"), css)
      expect(build.code, css).not.toBe(0)
      expect(build.output, css).toMatch(/src\/style\.css:\d+:\d+/)
      expect(build.output, css).toContain(named)
      expect(build.dist).toBe(false)
    })
  }
}

// What ADR-0003 allows passes: references to the theme, mixed or split by scheme, the theme's
// fonts, keywords that are not colours, words that only spell one (a property, a grid area, a
// function), siblings and `of` filters that are the block's own, and the block's names.
test("theme references, the block's own siblings and the block's names build", async () => {
  const build = await buildWith(
    plugin("quartz-page-source"),
    `.cgc-page-source {
      --cgc-page-source-gap: 1rem;
      border: 1px solid color-mix(in srgb, var(--secondary) 25%, var(--lightgray));
      background: light-dark(var(--light), var(--dark));
      color: currentColor;
      outline-color: transparent;
      font-family: var(--codeFont);
      transition: background-color 0.2s ease;
      animation: cgc-page-source-pulse 1s linear infinite;
      anchor-name: --cgc-page-source-menu;
    }
    .cgc-page-source__link + .cgc-page-source__icon,
    .cgc-page-source__link:has(> .cgc-page-source__icon) ~ .cgc-page-source__link {
      font: 600 1rem/1.2 var(--headerFont);
    }
    .cgc-page-source__icon:not(:first-child) { margin: 0; }
    .cgc-page-source__link:nth-child(2n + 1 of .cgc-page-source__link) {
      font: italic 600 1rem/1.2 var(--bodyFont);
      transition: background 0.2s ease;
      rotate: calc(tan(45deg) * 1deg);
      grid-area: tomato;
    }
    @keyframes cgc-page-source-pulse { to { opacity: 0.5; } }`,
  )
  expect(build.output).toBe("")
  expect(build.code).toBe(0)
  expect(build.dist).toBe(true)
})

// quartz-annotator styles markup PDF.js writes inside its own elements, so its selectors may reach
// anything inside an element of its blocks, but nothing beside or above one.
test("the annotator reaches inside its blocks, never beside or above them", async () => {
  const annotator = plugin("quartz-annotator")
  for (const [css, named] of [
    [".cgc-annotator-viewer__page + .sidebar { display: none; }", "+ .sidebar"],
    [".cgc-annotator-viewer__text-layer span ~ .sidebar { display: none; }", "~ .sidebar"],
    [".cgc-annotator:is(.sidebar *) { display: none; }", ":is(.sidebar *)"],
    [".cgc-annotator-viewer { & ~ p { display: none; } }", "& ~ p"],
    [".cgc-annotator-viewer__page:nth-child(1 of .sidebar *) { display: none; }", ".sidebar *"],
    ["@layer cgc.annotator { .cgc-annotator { margin: 0; } }", "@layer cgc.annotator"],
  ]) {
    const build = await buildWith(annotator, css)
    expect(build.code, css).not.toBe(0)
    expect(build.output, css).toContain(named)
  }
  // The check passes this one. The copy's build then stops at bundling the Viewer, which needs the
  // host's Preact, and a copy outside the repo has none: only the check is under test here.
  const inside = await buildWith(
    annotator,
    ".cgc-annotator-viewer__text-layer :is(span, br):not(.markedContent) { margin: 0; }",
  )
  expect(inside.output).not.toMatch(/breaks ADR-0003/)
})

// quartz-tag-explorer pins its one media query, the drawer's, which its plugin rewrites.
test("the tag explorer's pinned media query still holds", async () => {
  const build = await buildWith(
    plugin("quartz-tag-explorer"),
    "@media (max-width: 600px) { .cgc-tag-explorer { margin: 0; } }",
  )
  expect(build.code).not.toBe(0)
  expect(build.output).toContain("(max-width: 600px)")
})
