// The site's own files at its root that search engines fetch to check who owns it (FORK-LEDGER,
// "Root-level files"): Bing Webmaster's verification file and the IndexNow key file. v5's Static
// emitter writes only under `/static/`, so the site's build target copies them to the site root after
// `quartz build`, as v4's `_postbuild` did (`utils/postbuild.mjs`). No plugin emits anything at these
// paths, so the step's own output is what a crawler gets, served here the way the site is.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../harness/test.mjs"
import { testsRoot } from "../harness/site.mjs"
import { postbuild } from "../../utils/postbuild.mjs"

const ORIGIN = "https://blog.chaoticgood.computer"

// The key the site submits its URLs to IndexNow with (`utils/indexnow/submit-urls.mjs`). IndexNow
// accepts a submission only when the site serves that key at `/<key>.txt`.
const INDEXNOW_KEY = /INDEXNOW_API_KEY\s*=\s*'([^']+)'/.exec(
  fs.readFileSync(path.resolve(testsRoot, "../../utils/indexnow/submit-urls.mjs"), "utf8"),
)[1]
// The Bing Webmaster account the site is verified with.
const BING_USER = "3BD0278B33733CAE424EB3E98B8A58A9"

// A root file as a crawler fetches it from the site: the post-build step's output, beside the 404
// page `quartz build` emits, which a path with no file gets.
async function fetched(page, scratch, pathname) {
  const output = scratch.dir("site-root-files")
  fs.writeFileSync(path.join(output, "404.html"), "<!DOCTYPE html><title>404</title>")
  await postbuild(output)
  await routeSite(page, output, ORIGIN)
  const response = await page.goto(`${ORIGIN}${pathname}`)
  return { status: response.status(), body: await response.text() }
}

test("serves the IndexNow key file at the site root, holding the key the site submits with", async ({ page, scratch }) => {
  const { status, body } = await fetched(page, scratch, `/${INDEXNOW_KEY}.txt`)
  expect(status).toBe(200)
  expect(body.trim()).toBe(INDEXNOW_KEY)
})

test("serves Bing Webmaster's verification file at the site root", async ({ page, scratch }) => {
  const { status, body } = await fetched(page, scratch, "/BingSiteAuth.xml")
  expect(status).toBe(200)
  expect(body).toMatch(new RegExp(`<users>\\s*<user>${BING_USER}</user>\\s*</users>`))
})
