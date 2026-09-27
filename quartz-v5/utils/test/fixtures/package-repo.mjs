// A small repo shaped like ours for the package guards' tests (#98): a pnpm workspace file, the site
// package, a Quartz Core with its own `node_modules`, one plugin, one site plugin and one library,
// each already "built" (a `dist/` with a `.d.ts` beside each entry). As made, it keeps every rule
// the package guards check; each test breaks one or more of them in its own copy.
import fs from "node:fs"
import path from "node:path"
import { scratch, writeTree } from "../guard-helpers.mjs"

const json = (value) => JSON.stringify(value, null, 2)
const REPO_URL = "git+https://github.com/chaoticgoodcomputing/blog.git"

/** A plugin's (or site plugin's) package.json that meets the package contract. */
export function pluginManifest(dir, { site = false, ...extra } = {}) {
  const rest = dir.replace(/^(quartz|site)-/, "")
  return {
    name: `@chaoticgoodcomputing/${dir}`,
    version: "0.0.0",
    ...(site ? { private: true } : {}),
    type: "module",
    license: "MIT",
    repository: { type: "git", url: REPO_URL, directory: `quartz-v5/${site ? "site-plugins" : "plugins"}/${dir}` },
    files: ["dist"],
    publishConfig: { access: "public" },
    exports: {
      ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
      "./components": { types: "./dist/components/index.d.ts", import: "./dist/components/index.js" },
      "./package.json": "./package.json",
    },
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    peerDependencies: { preact: "^10.29.0", vfile: "^6.0.0" },
    devDependencies: { "@chaoticgoodcomputing/lib-good": "workspace:*" },
    quartz: { name: site ? dir : `cgc-${rest}`, dependencies: [] },
    ...extra,
  }
}

/** The files of one built plugin at `quartz-v5/<root>/<dir>`. */
export function pluginFiles(dir, { site = false, manifest = pluginManifest(dir, { site }) } = {}) {
  const at = `quartz-v5/${site ? "site-plugins" : "plugins"}/${dir}`
  return {
    [`${at}/package.json`]: json(manifest),
    [`${at}/project.json`]: json({ name: dir, root: at }),
    [`${at}/README.md`]: `# ${dir}\n`,
    [`${at}/LICENSE`]: "MIT\n",
    [`${at}/src/index.ts`]: "export {}\n",
    [`${at}/dist/index.js`]: 'import { h } from "preact"\nexport const x = h\n',
    [`${at}/dist/index.d.ts`]: "export { x }\n",
    [`${at}/dist/components/index.js`]: "export {}\n",
    [`${at}/dist/components/index.d.ts`]: "export {}\n",
  }
}

/**
 * Make the repo. Returns its root. `files` are written over the good tree (a value of `null`
 * deletes that path), so a test changes only what it breaks.
 */
export function makePackageRepo(files = {}) {
  const repo = scratch("package-guards-")
  writeTree(repo, {
    "pnpm-workspace.yaml": "packages:\n  - quartz-v5\n  - quartz-v5/libs/*\n  - quartz-v5/plugins/*\n  - quartz-v5/site-plugins/*\n",
    "quartz-v5/package.json": json({
      name: "site-v5",
      version: "0.0.0",
      private: true,
      dependencies: {
        "@chaoticgoodcomputing/quartz-good": "workspace:*",
        "@chaoticgoodcomputing/site-good": "workspace:*",
        "good-sidebar": "workspace:@chaoticgoodcomputing/quartz-good@*",
      },
    }),
    "quartz-v5/core/package.json": json({ name: "@jackyzha0/quartz", private: true }),
    "quartz-v5/core/node_modules/preact/package.json": json({ name: "preact", version: "10.29.8" }),
    "quartz-v5/core/node_modules/vfile/package.json": json({ name: "vfile", version: "6.0.3" }),
    "quartz-v5/core/node_modules/@quartz-community/types/package.json": json({ name: "@quartz-community/types" }),
    "quartz-v5/core/quartz.config.yaml": [
      "plugins:",
      '  - source: "@quartz-community/explorer"',
      "    enabled: true",
      '  - source: "@chaoticgoodcomputing/quartz-good"',
      "    enabled: true",
      "  - source:",
      '      repo: "@chaoticgoodcomputing/quartz-good"',
      "      name: good-sidebar",
      "    enabled: true",
      '  - source: "@chaoticgoodcomputing/site-good"',
      "    enabled: true",
      "",
    ].join("\n"),
    "quartz-v5/tests/quartz.config.yaml": [
      "plugins:",
      '  - source: "@chaoticgoodcomputing/quartz-good"',
      "    enabled: true",
      "  - source: ../fixture-plugins/fixture-good",
      "    enabled: true",
      "",
    ].join("\n"),
    "quartz-v5/tests/fixture-plugins/fixture-good/package.json": json({
      name: "fixture-good",
      quartz: { name: "fixture-good", dependencies: ["@chaoticgoodcomputing/quartz-good"] },
    }),
    ...pluginFiles("quartz-good"),
    ...pluginFiles("site-good", { site: true }),
    "quartz-v5/libs/lib-good/package.json": json({
      name: "@chaoticgoodcomputing/lib-good",
      version: "0.0.0",
      peerDependencies: { vfile: "^6.0.0" },
      dependencies: { "remark-parse": "^11.0.0" },
    }),
    "quartz-v5/libs/lib-good/src/index.ts": 'import { VFile } from "vfile"\nexport { VFile }\n',
  })
  // The host links a workspace install makes: a plugin resolves Core's copies through them.
  fs.symlinkSync("../core/node_modules", path.join(repo, "quartz-v5/plugins/node_modules"))
  fs.symlinkSync("../core/node_modules", path.join(repo, "quartz-v5/site-plugins/node_modules"))
  change(repo, files)
  return repo
}

/** Write `files` into `repo` (JSON-encoding objects); a `null` value deletes that path. */
export function change(repo, files) {
  for (const [rel, contents] of Object.entries(files)) {
    const at = path.join(repo, rel)
    if (contents === null) fs.rmSync(at, { recursive: true, force: true })
    else writeTree(repo, { [rel]: typeof contents === "string" ? contents : json(contents) })
  }
  return repo
}
