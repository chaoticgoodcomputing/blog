// Bundles the plugin to dist/. The site's Sass is compiled here, at the plugin's build, and inlined
// into dist/index.js as a string, so the built plugin imports nothing and Quartz never sees Sass
// (ADR-0003's site-plugin amendment: application CSS stays Sass, compiled in the plugin's own build).
import esbuild from "esbuild"
import * as sass from "sass"

const compileScss = {
  name: "scss",
  setup(build) {
    build.onLoad({ filter: /\.scss$/ }, (args) => {
      const { css, loadedUrls } = sass.compile(args.path, { style: "expanded" })
      return { contents: css, loader: "text", watchFiles: loadedUrls.map((url) => url.pathname) }
    })
  },
}

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  plugins: [compileScss],
  logLevel: "warning",
})
