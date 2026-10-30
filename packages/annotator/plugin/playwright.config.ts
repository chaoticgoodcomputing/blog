// The end-to-end suite: Hypothesis's own client in the plugin's pages, in Chromium, against the
// fake service, with a harness page in Obsidian's place (e2e/harness). It needs the build in
// dist/, which the Nx target builds first.

import { defineConfig, devices } from "@playwright/test"

const PORT = 4317

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}/`, viewport: { width: 1400, height: 900 }, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1400, height: 900 } } }],
  webServer: { command: `node --experimental-strip-types --disable-warning=ExperimentalWarning e2e/serve.mjs ${PORT}`, port: PORT, reuseExistingServer: false },
})
