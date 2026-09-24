import { defineConfig } from "@playwright/test"

export default defineConfig({
  globalSetup: "./harness/global-setup.mjs",
  projects: [
    // Cross-plugin specs: no-bleed, composition.
    { name: "suite", testDir: "./specs" },
    // Each plugin's own proof, living beside it.
    { name: "plugins", testDir: "../plugins", testMatch: "*/e2e/**/*.spec.mjs" },
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4173", browserName: "chromium" },
  webServer: [
    { command: "node harness/serve.mjs main 4173", port: 4173, reuseExistingServer: false },
    { command: "node harness/serve.mjs baseline 4174", port: 4174, reuseExistingServer: false },
  ],
})
