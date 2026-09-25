// index.ts imports the runtime `with { type: "text" }`, so this module's default export is its
// source text. Named to match, so the declaration travels with the file into every program that
// typechecks this library, a consuming plugin's included.
declare const source: string
export default source
