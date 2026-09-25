import { defineConfig } from "@playwright/test"
import { PORT, BASELINE_PORT, WORKERS, SCHEMES } from "./harness/env.mjs"

const DIRS = [
  // Cross-plugin specs: no-bleed, composition.
  { name: "suite", testDir: "./specs" },
  // Each plugin's own proof, living beside it.
  { name: "plugins", testDir: "../plugins", testMatch: "*/e2e/**/*.spec.mjs" },
  // Each library's own proof, through a plugin that inlines it.
  { name: "libs", testDir: "../libs", testMatch: "*/e2e/**/*.spec.mjs" },
  // Site plugins' proof: the site's own layer, which no fixture config loads.
  { name: "site-plugins", testDir: "../site-plugins", testMatch: "*/e2e/**/*.spec.mjs" },
]

export default defineConfig({
  globalSetup: "./harness/global-setup.mjs",
  // One project per directory and colour scheme, e.g. `plugins-light` (ADR-0004 rule 7). Narrow a
  // run to one scheme with `--project='*-dark'`.
  projects: DIRS.flatMap((dir) =>
    SCHEMES.map((scheme) => ({ ...dir, name: `${dir.name}-${scheme}`, use: { colorScheme: scheme } })),
  ),
  fullyParallel: true,
  workers: WORKERS,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, browserName: "chromium" },
  webServer: [
    { command: `node harness/serve.mjs main ${PORT}`, port: PORT, reuseExistingServer: false },
    { command: `node harness/serve.mjs baseline ${BASELINE_PORT}`, port: BASELINE_PORT, reuseExistingServer: false },
  ],
})
