#!/usr/bin/env node

/**
 * Parses the compiled resume PDF back to plaintext for ATS compatibility validation.
 *
 * This script extracts all text content from the resume PDF to verify that:
 * 1. The PDF can be parsed by standard PDF libraries (similar to ATS systems)
 * 2. Text content is extractable and readable
 * 3. No structural issues cause text to be lost or garbled
 *
 * Usage: node resume/utils/parse-pdf.mjs [input.pdf] [output.txt]
 *
 * Defaults:
 *   input:  dist/resume/resume.pdf
 *   output: dist/resume/parse.txt
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

const DEFAULT_INPUT = path.join(workspaceRoot, "dist/resume/resume.pdf");
const DEFAULT_OUTPUT = path.join(workspaceRoot, "dist/resume/parse.txt");

/**
 * Extracts text content from a single PDF page.
 * @param {PDFPageProxy} page - The PDF page object
 * @returns {Promise<string>} The extracted text content
 */
async function extractPageText(page) {
  const content = await page.getTextContent();

  // Group text items by their vertical position (y coordinate) to preserve line structure
  // PDF.js returns items with transform matrices where transform[5] is the y-coordinate
  const lines = new Map();

  for (const item of content.items) {
    if (!item.str) continue;

    // Round y-coordinate to group items on the same line (within 2px tolerance)
    const y = Math.round(item.transform[5] / 2) * 2;

    if (!lines.has(y)) {
      lines.set(y, []);
    }

    lines.get(y).push({
      x: item.transform[4],
      text: item.str,
    });
  }

  // Sort lines by y-coordinate (descending, since PDF y-axis is bottom-up)
  const sortedLines = Array.from(lines.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => {
      // Sort items within each line by x-coordinate
      return items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" ");
    });

  return sortedLines.join("\n");
}

/**
 * Main function to extract text from PDF and write to output file.
 */
async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const outputPath = process.argv[3] || DEFAULT_OUTPUT;

  // Verify input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input PDF not found: ${inputPath}`);
    console.error("   Run 'nx run resume:build' first to generate the PDF.");
    process.exit(1);
  }

  console.log(`📄 Parsing: ${path.relative(workspaceRoot, inputPath)}`);

  try {
    const loadingTask = getDocument(inputPath);
    const doc = await loadingTask.promise;

    console.log(`   Pages: ${doc.numPages}`);

    const pageTexts = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const text = await extractPageText(page);
      pageTexts.push(`=== PAGE ${i} ===\n\n${text}`);
      page.cleanup();
    }

    const fullText = pageTexts.join("\n\n");

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, fullText, "utf8");

    console.log(`✅ Output: ${path.relative(workspaceRoot, outputPath)}`);
    console.log(`   Characters: ${fullText.length}`);
    console.log(`   Lines: ${fullText.split("\n").length}`);
  } catch (err) {
    console.error(`❌ Failed to parse PDF: ${err.message}`);
    process.exit(1);
  }
}

main();
