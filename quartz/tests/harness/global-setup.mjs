// One cold build per `playwright test` run. `quartz build --serve` is not an option: a long-lived
// Quartz process never re-imports a rebuilt plugin. See docs/adr/0004.
import { buildAll } from "./site.mjs"

export default async function globalSetup() {
  await buildAll()
}
