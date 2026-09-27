// build.mjs loads the stylesheet as text.
declare module "*.css" {
  const css: string
  export default css
}
