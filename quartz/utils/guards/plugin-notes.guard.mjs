// Repo guard: every shareable plugin's README is its plugin note (#86).
//
// A plugin's README is its note in the vault: it carries the plugins' tag, `projects/site/plugins`, in
// its frontmatter, so the tag's page lists it, and the vault links it in as
// `content/public/plugins/<dir>.md`, a symlink to the README, which the DAG's nodes link to.
//
//   node quartz/utils/guards/plugin-notes.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-plugin-notes.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { REPO_ROOT } from "../core-tiers.mjs"
import { KINDS, SITE_REL, parseYaml } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const TAG = "projects/site/plugins"
const NOTES = "content/public/plugins"

const frontmatterOf = (text) => parseYaml(/^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "") ?? {}

await guard(import.meta, "Every shareable plugin's README is its plugin note, tagged and in the vault", (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  const root = path.join(repo, SITE_REL, KINDS.plugin)
  if (!fs.existsSync(root)) throw new CannotCheck(`no plugins under ${repo}`)
  const plugins = fs.readdirSync(root).filter((dir) => fs.existsSync(path.join(root, dir, "package.json"))).sort()

  const violations = []
  for (const dir of plugins) {
    const rel = `${SITE_REL}/${KINDS.plugin}/${dir}`
    const readme = path.join(root, dir, "README.md")
    if (!fs.existsSync(readme)) {
      violations.push(`${rel}: it has no README.md, its plugin note`)
      continue
    }
    const { tags } = frontmatterOf(fs.readFileSync(readme, "utf-8"))
    if (!(Array.isArray(tags) && tags.includes(TAG))) violations.push(`${rel}/README.md: its tags leave out ${TAG}`)
    const note = path.join(repo, NOTES, `${dir}.md`)
    if (!(fs.existsSync(note) && fs.lstatSync(note).isSymbolicLink() && fs.realpathSync(note) === fs.realpathSync(readme))) {
      violations.push(`${rel}: no plugin note ${NOTES}/${dir}.md links to its README`)
    }
  }
  return violations
})
