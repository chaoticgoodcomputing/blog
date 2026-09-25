// Compiles the plugin to dist/, the path Quartz's loader imports. It has no runtime dependencies,
// so there is nothing to inline or leave external: esbuild only strips the types.
import esbuild from "esbuild"

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  logLevel: "warning",
})
