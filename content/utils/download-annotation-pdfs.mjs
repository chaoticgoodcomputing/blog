#!/usr/bin/env node
/**
 * Downloads PDFs referenced in annotation-target frontmatter fields
 * and places them in public/assets/annotated-documents/
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(CONTENT_DIR, 'public/assets/annotated-documents')

async function downloadPDF(url, outputPath) {
  console.log(`Downloading: ${url}`)

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(buffer))
    console.log(`✓ Saved: ${path.basename(outputPath)}`)
    return true
  } catch (error) {
    console.error(`✗ Failed to download ${url}: ${error.message}`)
    return false
  }
}

function getFilenameFromUrl(url) {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  let filename = decodeURIComponent(path.basename(pathname))

  // Sanitize filename: replace spaces and problematic characters with hyphens
  filename = filename.replace(/[\s]+/g, '-')

  // Ensure it has .pdf extension
  if (!filename.toLowerCase().endsWith('.pdf')) {
    return filename + '.pdf'
  }

  return filename
}

async function findMarkdownFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await findMarkdownFiles(fullPath, files)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) return {}

  const frontmatter = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()

    // Remove quotes if present
    frontmatter[key] = value.replace(/^["']|["']$/g, '')
  }

  return frontmatter
}

async function main() {
  console.log('Searching for annotation files...')

  // Find all markdown files with annotation-target frontmatter
  const markdownFiles = await findMarkdownFiles(CONTENT_DIR)

  const pdfUrls = new Map() // url -> filename mapping

  for (const filePath of markdownFiles) {
    const content = await fs.readFile(filePath, 'utf-8')
    const frontmatter = parseFrontmatter(content)

    if (frontmatter['annotation-target']) {
      const url = frontmatter['annotation-target']
      const filename = getFilenameFromUrl(url)
      pdfUrls.set(url, filename)
    }
  }

  if (pdfUrls.size === 0) {
    console.log('No annotation PDFs found.')
    return
  }

  console.log(`Found ${pdfUrls.size} unique PDF(s) to download.`)

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Download PDFs
  let successCount = 0
  for (const [url, filename] of pdfUrls) {
    const outputPath = path.join(OUTPUT_DIR, filename)

    // Check if already exists
    try {
      await fs.access(outputPath)
      console.log(`⊙ Already exists: ${filename}`)
      successCount++
      continue
    } catch {
      // File doesn't exist, download it
    }

    const success = await downloadPDF(url, outputPath)
    if (success) successCount++
  }

  console.log(`\nCompleted: ${successCount}/${pdfUrls.size} PDFs ready`)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
