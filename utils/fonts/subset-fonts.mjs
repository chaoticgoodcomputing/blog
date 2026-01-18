#!/usr/bin/env node

/**
 * Subsets downloaded fonts to only characters used on the site
 * Uses glyphhanger to analyze built HTML files
 * 
 * Note: This requires a completed build to analyze HTML.
 * For initial setup, this script can be skipped (full fonts will be used).
 */

import { execSync } from "child_process"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE_ROOT = path.resolve(__dirname, "../..")
const PUBLIC_DIR = path.join(WORKSPACE_ROOT, "dist/public")
const FONTS_DIR = path.join(WORKSPACE_ROOT, "quartz/static/fonts")

// Check if glyphhanger is available
function checkGlyphhanger() {
  try {
    execSync("which glyphhanger", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

async function checkPublicDir() {
  try {
    await fs.access(PUBLIC_DIR)
    return true
  } catch {
    return false
  }
}

async function subsetFont(fontId, fontDir) {
  console.log(`🔍 Analyzing ${fontId}...`)

  const fontFiles = await fs.readdir(fontDir)
  const woff2Files = fontFiles.filter((f) => f.endsWith(".woff2"))

  if (woff2Files.length === 0) {
    console.log(`  ⚠️  No .woff2 files found in ${fontId}`)
    return
  }

  for (const fontFile of woff2Files) {
    const fontPath = path.join(fontDir, fontFile)

    try {
      // Run glyphhanger to analyze which glyphs are actually used
      const cmd = `glyphhanger ${PUBLIC_DIR}/**/*.html --subset="${fontPath}" --formats=woff2`
      console.log(`  ↓ Subsetting ${fontFile}...`)

      execSync(cmd, {
        cwd: WORKSPACE_ROOT,
        stdio: "pipe",
      })

      // glyphhanger creates a -subset file, replace original
      const subsetPath = fontPath.replace(".woff2", "-subset.woff2")
      const subsetExists = await fs
        .access(subsetPath)
        .then(() => true)
        .catch(() => false)

      if (subsetExists) {
        const originalSize = (await fs.stat(fontPath)).size
        const subsetSize = (await fs.stat(subsetPath)).size
        const savings = ((1 - subsetSize / originalSize) * 100).toFixed(1)

        await fs.rename(subsetPath, fontPath)
        console.log(`  ✓ ${fontFile}: ${savings}% smaller`)
      } else {
        console.log(`  ⚠️  No subset generated for ${fontFile}`)
      }
    } catch (error) {
      console.error(`  ✗ Failed to subset ${fontFile}: ${error.message}`)
    }
  }
}

async function main() {
  console.log("✂️  Font Subsetting Utility\n")

  // Check prerequisites
  if (!checkGlyphhanger()) {
    console.log("⚠️  glyphhanger not found. Install with: npm install -g glyphhanger")
    console.log("Skipping subsetting (full fonts will be used)\n")
    return
  }

  if (!(await checkPublicDir())) {
    console.log("⚠️  dist/public/ directory not found. Run build first.")
    console.log("Skipping subsetting (full fonts will be used)\n")
    return
  }

  // Find font directories
  const fontDirs = await fs.readdir(FONTS_DIR)

  for (const fontId of fontDirs) {
    const fontDir = path.join(FONTS_DIR, fontId)
    const stat = await fs.stat(fontDir)

    if (stat.isDirectory()) {
      await subsetFont(fontId, fontDir)
    }
  }

  console.log("\n✅ Font subsetting complete!")
}

main().catch((error) => {
  console.error("❌ Font subsetting failed:", error)
  process.exit(1)
})
