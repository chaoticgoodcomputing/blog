/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url"
import { getViteConfig } from "astro/config"

// The unit tests read the fixture vault, never the real one. It is named before the Astro config
// loads, since the config opens a vault as it loads, and so does any module that asks for the notes.
const fixtureVault = fileURLToPath(new URL("./test/fixtures/vault", import.meta.url))
process.env.VAULT_ROOT = fixtureVault

// The tests run in a time zone that is not UTC, wherever they are run, so a date that was read in
// the machine's zone fails one. Set here, before Vitest starts the processes the tests run in.
process.env.TZ = "America/Los_Angeles"

export default getViteConfig({
  test: {
    // Only the unit tests: the Playwright specs under src/test are not Vitest's.
    include: ["test/**/*.test.ts"],
    env: { VAULT_ROOT: fixtureVault },
  },
})
