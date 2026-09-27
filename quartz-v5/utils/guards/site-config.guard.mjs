// Repo guard: the site config validates against Core's plugin config schema (#89, #97).
//
// The site config, `core/quartz.config.yaml`, is checked against the JSON Schema in Core source,
// `quartz/plugins/quartz-plugins.schema.json`, and every error is listed at its path. A missing or
// empty site config, or one with no plugins list, fails too: upstream's default config is pruned, so
// Quartz would have nothing to fall back on (prebuild refuses those before a build as well). The
// validator is `utils/site-config-schema.mjs`, which takes the schema as input. Where Core's schema
// lags Core's own loader, it is amended first (`SCHEMA_AMENDMENTS` there), and an amendment the
// schema no longer needs is a violation too, so that the list only ever shrinks.
//
//   node quartz-v5/utils/guards/site-config.guard.mjs [--config <file>] [--schema <file>]
//
// Test and how to break it by hand: utils/test/guard-site-config.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { CORE_DIR } from "../core-tiers.mjs"
import { SCHEMA_REL, amendSchema, formatError, validateSiteConfig } from "../site-config-schema.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

await guard(import.meta, "The site config validates against Core's plugin config schema", (argv) => {
  const config = path.resolve(option(argv, "config", path.join(CORE_DIR, "quartz.config.yaml")))
  const schemaFile = path.resolve(option(argv, "schema", path.join(CORE_DIR, SCHEMA_REL)))
  let schema
  try {
    schema = JSON.parse(fs.readFileSync(schemaFile, "utf-8"))
  } catch (err) {
    throw new CannotCheck(`cannot read the plugin config schema at ${schemaFile}: ${err.message}`)
  }
  if (!fs.existsSync(config)) {
    return [`No site config at ${config}. It is a steering file (quartz-v5/VENDORED.md): git checkout -- quartz-v5/core/quartz.config.yaml`]
  }
  return [...amendSchema(schema).notes, ...validateSiteConfig(fs.readFileSync(config, "utf-8"), schema).map(formatError)]
})
