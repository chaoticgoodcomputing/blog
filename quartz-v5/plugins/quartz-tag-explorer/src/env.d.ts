// build.mjs loads the stylesheet as text.
declare module "*.css" {
  const css: string
  export default css
}

// build.mjs bundles an `inline:` import for the browser, and hands over the bundle as text: the
// component's `afterDOMLoaded` script.
declare module "inline:*" {
  const source: string
  export default source
}
