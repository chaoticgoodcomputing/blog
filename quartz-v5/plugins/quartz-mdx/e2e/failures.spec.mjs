// ADR-0001: an unresolved import, or a widget that throws while rendering, fails the build and
// names the page. So does a prop that is not data (ADR-0002).
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite } from "../../../tests/harness/site.mjs"

const page = (body) => `---\ntitle: Broken\n---\n\n${body}\n`

test("an unresolved import fails the build", async () => {
  const { code, output } = await buildScratchSite("unresolved", {
    "index.md": "# home\n",
    "broken.mdx": page("import { Nope } from './missing/Nope'\n\n<Nope />"),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("broken.mdx")
  expect(output).toContain("./missing/Nope")
})

test("a widget that throws while rendering fails the build", async () => {
  const { code, output } = await buildScratchSite("throws", {
    "index.md": "# home\n",
    "Bomb.tsx": "export default function Bomb() { throw new Error('kaboom') }\n",
    "broken.mdx": page("import Bomb from './Bomb'\n\n<Bomb />"),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("broken.mdx")
  expect(output).toContain("kaboom")
})

test("a prop that is not data fails the build", async () => {
  const { code, output } = await buildScratchSite("not-data", {
    "index.md": "# home\n",
    "Echo.tsx": "export default function Echo() { return <p>hi</p> }\n",
    "broken.mdx": page("import Echo from './Echo'\n\n<Echo onClick={() => alert(1)} />"),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("broken.mdx")
  expect(output).toContain("onClick")
})

test("a component used without an import fails the build", async () => {
  const { code, output } = await buildScratchSite("unimported", {
    "index.md": "# home\n",
    "broken.mdx": page("<Mystery />"),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("Mystery")
})
