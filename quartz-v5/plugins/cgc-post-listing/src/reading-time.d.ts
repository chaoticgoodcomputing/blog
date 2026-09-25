// reading-time's word counter on its own, without the package's index, which also loads a Node
// stream wrapper: esbuild would bundle that as a `require("stream")` an ES module can't run.
declare module "reading-time/lib/reading-time.js" {
  export { default } from "reading-time"
}
