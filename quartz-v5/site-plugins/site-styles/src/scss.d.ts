// build.mjs compiles each imported stylesheet and inlines it as a string.
declare module "*.scss" {
  const css: string
  export default css
}
