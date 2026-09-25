// build.mjs loads `*.inline.js` as text.
declare module "*.inline.js" {
  const source: string
  export default source
}
