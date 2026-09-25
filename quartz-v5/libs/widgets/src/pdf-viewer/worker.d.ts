// PDF.js's worker, imported as text through an import attribute (`with { type: "text" }`), which
// esbuild honours with no loader configuration. See document.ts.
declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
  const source: string
  export default source
}
