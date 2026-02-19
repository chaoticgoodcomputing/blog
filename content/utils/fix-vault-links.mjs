#!/usr/bin/env node

import { globby } from "globby"
import { readFile, writeFile } from "fs/promises"
import { relative } from "path"

const PUBLIC_DIR = "public"

/**
 * Fix links in public markdown/mdx files by stripping private/ and public/ prefixes.
 * This ensures all internal links are relative to the public directory root.
 */
async function fixLinksInPublicFiles() {
  console.log(`🔗 Fixing links in public markdown files...`)

  // Include both .md and .mdx files
  const publicFiles = await globby([`${PUBLIC_DIR}/**/*.{md,mdx}`], {
    ignore: ["**/node_modules/**", "**/.git/**", "**/templates/**"],
  })

  if (publicFiles.length === 0) {
    console.log("ℹ️  No public markdown files found.")
    return
  }

  console.log(`📄 Found ${publicFiles.length} file(s) to process`)

  let fixed = 0
  let unchanged = 0
  let errors = 0

  for (const publicFilePath of publicFiles) {
    try {
      let content = await readFile(publicFilePath, "utf-8")
      const originalContent = content

      // Strip private/ and public/ prefixes from wikilinks (with leading slash)
      // Pattern: [[/public/path|display]] or [[/private/path]] → [[/path|display]] or [[/path]]
      content = content.replace(/\[\[\/(?:private|public)\/([-\w\/\.]+)(\|[^\]]+)?\]\]/g, '[[/$1$2]]')

      // Strip private/ and public/ prefixes from wikilinks (without leading slash) and add leading slash
      // Pattern: [[public/path|display]] or [[private/path]] → [[/path|display]] or [[/path]]
      content = content.replace(/\[\[(?:private|public)\/([-\w\/\.]+)(\|[^\]]+)?\]\]/g, '[[/$1$2]]')

      // Strip private/ and public/ prefixes from markdown links (with leading slash)
      // Pattern: ](/public/path) or ](/private/path) → ](/path)
      content = content.replace(/(?<!:\/\/[^\s]*)\]\(\/(?:private|public)\/([-\w\/\.]+)\)/g, '](/$1)')

      // Strip private/ and public/ prefixes from markdown links (without leading slash) and add leading slash
      // Pattern: ](public/path) or ](private/path) → ](/path)
      // Negative lookbehind ensures we don't match URLs like https://example.com/public/path
      content = content.replace(/(?<!:\/\/[^\s]*)\]\((?:private|public)\/([-\w\/\.]+)\)/g, '](/$1)')

      // Only write if changes were made
      if (content !== originalContent) {
        await writeFile(publicFilePath, content, "utf-8")
        const relativePath = relative(PUBLIC_DIR, publicFilePath)
        console.log(`  ✅ Fixed links in ${relativePath}`)
        fixed++
      } else {
        unchanged++
      }
    } catch (error) {
      const relativePath = relative(PUBLIC_DIR, publicFilePath)
      console.error(`  ❌ Error fixing links in ${relativePath}:`, error instanceof Error ? error.message : error)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Fixed: ${fixed}`)
  console.log(`   ⏭️  Unchanged: ${unchanged}`)
  console.log(`   ❌ Errors: ${errors}`)
}

// Run the link fixing
fixLinksInPublicFiles().catch((error) => {
  console.error("💥 Fatal error:", error)
  process.exit(1)
})
