// build.mjs loads the stylesheet as text.
declare module "*.css" {
  const css: string
  export default css
}

// build.mjs bundles the browser runtime, src/runtime/main.ts, and hands it to the component as text.
declare module "cgc-graph:runtime" {
  const source: string
  export default source
}
