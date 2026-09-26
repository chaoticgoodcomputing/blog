// Under `quartz build --serve`, Quartz re-parses only the `.md` files that changed, which left open
// whether an `.mdx` edit rebuilds at all (#65). It does: every rebuild runs each page type's
// `generate` again, and cgc-mdx compiles its pages afresh for every build. Proven on a serve run
// kept up while its content changes under it.
import fs from "node:fs"
import path from "node:path"
import { test, expect } from "../../../tests/harness/test.mjs"
import { serveScratchSite, testsRoot, vendored } from "../../../tests/harness/site.mjs"

const note = (title, body) => `---\ntitle: ${title}\n---\n\n${body}\n`
const withWidget = (text) => note("Page", `import Hello from './Hello'\n\n${text}\n\n<Hello />`)
const widget = (text) => `export default function Hello() { return <p class="hello">${text}</p> }\n`

test("an .mdx page rebuilds under serve when it, or a widget it imports, changes", async () => {
  test.setTimeout(180_000)
  const site = await serveScratchSite("mdx-watch", {
    "index.md": note("Home", "Home."),
    "page.mdx": withWidget("First draft."),
    "Hello.tsx": widget("Hello from the first widget."),
  })
  const page = (slug) => fs.readFileSync(path.join(site.public, `${slug}.html`), "utf8")
  try {
    expect(page("page")).toContain("First draft.")
    expect(page("page")).toContain("Hello from the first widget.")

    await site.write("page.mdx", withWidget("Second draft."))
    expect(page("page")).toContain("Second draft.")

    await site.write("Hello.tsx", widget("Hello from the second widget."))
    expect(page("page")).toContain("Hello from the second widget.")

    await site.write("fresh.mdx", note("Fresh", "A page added while serving."))
    expect(page("fresh")).toContain("A page added while serving.")
  } finally {
    await site.stop()
  }
})

// The serve run above writes its output outside the Quartz root, because serve's source watcher
// watches every `.ts` and `.tsx` under the root, and takes a widget's source, copied into an output
// there, for Quartz's own: it then restarts the whole build, over and over. The site's own serve
// writes outside the root too, so what the spec proves is what the site does.
test("the site's serve writes outside the Quartz root, as the serve run does", () => {
  const { serve } = JSON.parse(fs.readFileSync(path.join(testsRoot, "../project.json"), "utf8")).targets
  const cwd = serve.options.cwd.replace("{workspaceRoot}", path.resolve(testsRoot, "../.."))
  expect(cwd).toBe(vendored)
  const output = serve.options.command.match(/--output\s+(\S+)/)?.[1]
  expect(output).toBeTruthy()
  expect(path.relative(vendored, path.resolve(cwd, output)).startsWith("..")).toBe(true)
})
