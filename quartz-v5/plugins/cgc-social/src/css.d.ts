// The Bluesky renderer imports its stylesheet for its side effect (libs/widgets/src/bluesky), which
// build.mjs bundles into this package's own.
declare module "*.css" {
  const css: string
  export default css
}
