// index.ts imports the browser script `with { type: "text" }`, so this module's default export is
// its source text. Named to match, so the declaration travels with the file.
declare const source: string
export default source
