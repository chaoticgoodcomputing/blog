// Recognizes a PDF's textless pages and writes its text file beside it: `pnpm run recognize <file.pdf>`.

import { readFileSync, writeFileSync } from "node:fs"
import { recognizePdf } from "../src/node.ts"
import { textFileName } from "../src/text-file.ts"

const file = process.argv[2]
if (!file) throw new Error("usage: recognize <file.pdf>")
const started = Date.now()
const text = await recognizePdf(new Uint8Array(readFileSync(file)), {
  onProgress: (done, total) => process.stderr.write(`\rrecognized ${done} of ${total} pages`),
})
process.stderr.write("\n")
writeFileSync(textFileName(file), JSON.stringify(text))
console.log(`${textFileName(file)}: ${Object.keys(text.pages).length} pages recognized, in ${Math.round((Date.now() - started) / 1000)} s`)
