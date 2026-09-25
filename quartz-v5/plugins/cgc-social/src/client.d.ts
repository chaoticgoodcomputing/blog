// The cards' browser script and the plugin's whole stylesheet, as text: build.mjs bundles both before
// it bundles the plugin, and serves them as this module.
declare module "cgc-social:client" {
  /** The browser script (src/client/), with the Bluesky client and renderer inlined. */
  export const script: string
  /** src/style.css, after the post card's stylesheet, all in `@layer cgc.social`. */
  export const stylesheet: string
}
