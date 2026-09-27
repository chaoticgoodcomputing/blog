// The fixture palette: the theme colours tests/quartz.config.yaml gives the fixture site, in each
// scheme, as a browser computes them (`rgb(r, g, b)`). Read from the config, so a spec that expects
// a theme colour (a tag colour of `var(--secondary)`, or `darkgray` where a lineage has none) states
// it once, by name: `FIXTURE_PALETTE.secondary[colorScheme]`.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { testsRoot, core } from "./site.mjs"

const YAML = createRequire(path.join(core, "package.json"))("yaml")
const { colors } = YAML.parse(fs.readFileSync(path.join(testsRoot, "quartz.config.yaml"), "utf8"))
  .configuration.theme

// `#rrggbb` as computed style reports it. The palette's other forms (`rgba()`, `#rrggbbaa`) are
// left out: no spec expects them.
const computed = (hex) => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  return match && `rgb(${match.slice(1).map((pair) => parseInt(pair, 16)).join(", ")})`
}

/** `{ [name]: { light, dark } }`, for each palette colour written as `#rrggbb` in both schemes. */
export const FIXTURE_PALETTE = Object.fromEntries(
  Object.keys(colors.lightMode)
    .map((name) => [
      name,
      { light: computed(colors.lightMode[name]), dark: computed(colors.darkMode[name]) },
    ])
    .filter(([, { light, dark }]) => light && dark),
)
