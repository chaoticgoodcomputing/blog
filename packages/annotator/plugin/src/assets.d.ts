// Images the plugin bundles, as esbuild gives them: `data:` URLs (scripts/build.mjs).
declare module "*.svg" {
  const url: string
  export default url
}
