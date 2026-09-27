// The pipeline rebuilt from the site's configured transformers can leave some of them out: a
// denylist, by transformer name. Exercised through a probe plugin, which tests the library on its
// own; quartz-annotator's specs prove it on a real plugin.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"
import { buildProbePlugin } from "../../../tests/harness/probe.mjs"

const probeSource = path.join(path.dirname(fileURLToPath(import.meta.url)), "probe")

test("a denylisted transformer is left out, and every other one still runs", async () => {
  const probe = await buildProbePlugin(probeSource, "pipeline-probe", { category: ["emitter"] })
  const site = await buildScratchSite(
    "pipeline-denylist",
    {
      "index.md": "# home\n",
      "plain-note.md": "# plain note\n",
      "probe.md":
        "Maths: $e^{i\\pi} + 1 = 0$\n\nA wikilink to [[plain-note]], and ~~struck~~ text.\n",
    },
    {
      config: withPlugins(fixtureConfig(), [
        { source: probe.path, enabled: true, options: { skip: ["Latex"] } },
      ]),
      keep: true,
    },
  )
  try {
    expect(site.code, site.output).toBe(0)
    const full = fs.readFileSync(path.join(site.public, "probe/full.html"), "utf8")
    const skipped = fs.readFileSync(path.join(site.public, "probe/skipped.html"), "utf8")

    // Latex renders the maths that ObsidianFlavoredMarkdown parsed. Without it, the source stays.
    expect(full).toContain('class="katex"')
    expect(skipped).not.toContain("katex")
    expect(skipped).toMatch(/<code class="[^"]*math-inline[^"]*">e\^\{i\\pi\} \+ 1 = 0<\/code>/)
    for (const html of [full, skipped]) {
      expect(html).toMatch(/<a href="\.\/plain-note" class="internal[^"]*"[^>]*>plain-note<\/a>/)
      expect(html).toContain("<del>struck</del>")
    }
  } finally {
    site.remove()
    probe.remove()
  }
})
