// The fixture vault's mirror directory, for the end-to-end suite (playwright.config.ts): the mirrors
// kept in test/fixtures/mirrors, and a scanned one made here, so no more PDFs are kept in the
// repository: Garden.pdf, pdf-ocr's scanned fixture (packages/pdf-ocr/test/fixture-pdf.ts), with its
// text file, recognized as `astro:mirrors` recognizes a mirror's.
//
//   node --experimental-strip-types scripts/fixture-mirrors.ts <directory>

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { recognizePdf } from "@chaoticgoodcomputing/pdf-ocr/node"
import { textFileName } from "@chaoticgoodcomputing/pdf-ocr/text"
import { scannedPdf } from "../../packages/pdf-ocr/test/fixture-pdf.ts"

const into = process.argv[2]
if (!into) throw new Error("usage: fixture-mirrors <directory>")
const kept = fileURLToPath(new URL("../test/fixtures/mirrors", import.meta.url))
fs.rmSync(into, { recursive: true, force: true })
fs.mkdirSync(into, { recursive: true })
for (const file of fs.readdirSync(kept)) fs.copyFileSync(path.join(kept, file), path.join(into, file))
const garden = scannedPdf()
fs.writeFileSync(path.join(into, "Garden.pdf"), garden)
fs.writeFileSync(path.join(into, textFileName("Garden.pdf")), JSON.stringify(await recognizePdf(garden)))
console.log(`The fixture's mirrors, with a scanned one, in ${into}`)
