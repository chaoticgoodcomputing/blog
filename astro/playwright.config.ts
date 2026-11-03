import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"
import { builtSite } from "./src/test/build.ts"
import { ownServer, portOf, refuseBesideDevServer } from "./src/test/own-server.ts"

// The built site, served by `astro preview`, over one of two vaults: the fixture vault (the
// default), or with E2E_SITE=vault the real one, for what a ticket says is "checked in a browser".
// The suite builds its own site and serves it on its own port, so suites in separate checkouts run
// side by side (docs/adr/0007).
const root = fileURLToPath(new URL(".", import.meta.url))
const site = process.env.E2E_SITE === "vault" ? "vault" : "fixture"

// Never beside this checkout's dev server (src/test/own-server.ts).
refuseBesideDevServer(root, "the end-to-end suite")

// A port per checkout, from its path, so worktrees differ without anyone choosing; E2E_PORT names
// one outright.
const port = Number(process.env.E2E_PORT ?? portOf(root))
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: `./src/test/${site}`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: ownServer(root, {
    outDir: builtSite(site),
    cacheDir: `${root}.e2e/${site}/cache`,
    port,
    // The fixture's mirrors, with a scanned one and its text file made for the run (scripts/fixture-mirrors.ts).
    // The fixture's Bluesky posts too, one of them, so that the run asks nothing of Bluesky (src/lib/bluesky-posts.ts),
    // and its Hacker News thread and a webmention, both of "A note with backlinks", already the most central post, so
    // that it asks nothing of Hacker News or webmention.io (src/lib/hacker-news.ts, src/lib/mentions.ts).
    env:
      site === "fixture"
        ? {
            VAULT_ROOT: `${root}test/fixtures/vault`,
            MIRRORS_ROOT: `${root}.e2e/fixture/mirrors`,
            BLUESKY_POSTS_FILE: `${root}test/fixtures/bluesky/author-feed.json`,
            HACKER_NEWS_FILE: `${root}test/fixtures/hacker-news/threads.json`,
            WEBMENTIONS_FILE: `${root}test/fixtures/webmentions/mentions.json`,
          }
        : {},
    before: site === "fixture" ? `node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/fixture-mirrors.ts ${root}.e2e/fixture/mirrors` : undefined,
  }),
})
