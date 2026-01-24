#!/usr/bin/env node

import { globby } from "globby"
import matter from "gray-matter"
import { mkdir, readFile, writeFile, unlink } from "fs/promises"
import { dirname, relative, join } from "path"
import { existsSync } from "fs"

const PRIVATE_DIR = "private"
const PUBLIC_DIR = "public"
const PRIVATE_BODY_FILE = "public/assets/PRIVATE_FILE_BODY.txt"

/**
 * Remove all public markdown files that have the "private" tag.
 * This ensures deleted private files are cleaned up during sync.
 * 
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupPrivateTaggedFiles() {
  console.log("🧹 Cleaning up existing private-tagged files...")

  const publicFiles = await globby([`${PUBLIC_DIR}/**/*.md`], {
    ignore: ["**/node_modules/**", "**/.git/**", "**/templates/**"],
  })

  let deleted = 0

  for (const publicFilePath of publicFiles) {
    try {
      const content = await readFile(publicFilePath, "utf-8")
      const { data: frontmatter } = matter(content)

      // Check if the file has the "private" tag
      const tags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : frontmatter.tags
          ? [frontmatter.tags]
          : []

      if (tags.includes("private")) {
        await unlink(publicFilePath)
        const relativePath = relative(PUBLIC_DIR, publicFilePath)
        console.log(`  🗑️  Deleted ${relativePath}`)
        deleted++
      }
    } catch (error) {
      // Ignore read errors - file might have been deleted already
      if (error.code !== "ENOENT") {
        console.error(`  ⚠️  Error checking ${publicFilePath}:`, error instanceof Error ? error.message : error)
      }
    }
  }

  console.log(`🧹 Removed ${deleted} private-tagged file(s)\n`)
  return deleted
}

/**
 * Extract wikilinks and markdown links from content
 * @param {string} content - The markdown content to extract links from
 * @returns {string[]} Array of formatted link strings
 */
function extractLinks(content) {
  const links = []
  const seen = new Set()

  // Extract wikilinks: [[link]] or [[link|display text]]
  const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  let match

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const linkTarget = match[1]
    const displayText = match[2] || linkTarget
    const linkStr = `[${displayText}](${linkTarget})`

    if (!seen.has(linkStr)) {
      links.push(linkStr)
      seen.add(linkStr)
    }
  }

  // Extract markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const displayText = match[1]
    const url = match[2]
    const linkStr = `[${displayText}](${url})`

    if (!seen.has(linkStr)) {
      links.push(linkStr)
      seen.add(linkStr)
    }
  }

  return links
}

/**
 * Extract frontmatter from private markdown files and create cleaned versions
 * in the public directory, preserving the directory structure.
 * 
 * Files that already exist in public are skipped (public content takes precedence).
 */
async function extractPrivateMetadata() {
  console.log("🔍 Scanning for private markdown files...")

  // Check if private directory exists and has content
  if (!existsSync(PRIVATE_DIR)) {
    console.log("⚠️  Private directory not found. Skipping sync to avoid deleting existing files.")
    console.log("ℹ️  This is expected in CI environments without access to the private submodule.")
    return
  }

  // Check if there are any markdown files in private directory
  const privateFiles = await globby([`${PRIVATE_DIR}/**/*.md`], {
    ignore: ["**/node_modules/**", "**/.git/**"],
  })

  if (privateFiles.length === 0) {
    console.log("⚠️  No private markdown files found. Skipping sync to avoid deleting existing files.")
    console.log("ℹ️  This is expected in CI environments without access to the private submodule.")
    return
  }

  console.log(`📄 Found ${privateFiles.length} private file(s)`)

  // Clean up existing private-tagged files first
  await cleanupPrivateTaggedFiles()

  // Read the private file body template
  let privateBodyContent = "*This is a private note. Only metadata is publicly available.*\n"
  try {
    privateBodyContent = await readFile(PRIVATE_BODY_FILE, "utf-8")
  } catch (error) {
    console.log("⚠️  Could not read PRIVATE_FILE_BODY.txt, using default message")
  }

  let extracted = 0
  let skipped = 0
  let errors = 0

  for (const privateFilePath of privateFiles) {
    try {
      // Calculate the relative path from private dir
      const relativePath = relative(PRIVATE_DIR, privateFilePath)
      const publicFilePath = join(PUBLIC_DIR, relativePath)

      // Skip if target is in templates directory
      if (publicFilePath.includes('/templates/')) {
        skipped++
        continue
      }

      // Read the private file
      const content = await readFile(privateFilePath, "utf-8")

      // Parse frontmatter and content
      const { data: frontmatter, content: bodyContent } = matter(content)

      // Ensure "private" tag is added to tags array
      if (!frontmatter.tags) {
        frontmatter.tags = []
      } else if (!Array.isArray(frontmatter.tags)) {
        frontmatter.tags = [frontmatter.tags]
      }
      if (!frontmatter.tags.includes("private")) {
        frontmatter.tags.push("private")
      }

      // Extract links from the original content
      const links = extractLinks(bodyContent)

      // Create a markdown file with only frontmatter
      let cleanedContent = ""

      if (Object.keys(frontmatter).length > 0) {
        // Convert frontmatter back to YAML
        cleanedContent = "---\n"
        for (const [key, value] of Object.entries(frontmatter)) {
          if (Array.isArray(value)) {
            cleanedContent += `${key}:\n`
            for (const item of value) {
              cleanedContent += `  - ${JSON.stringify(item)}\n`
            }
          } else if (typeof value === "string" && value.includes("\n")) {
            cleanedContent += `${key}: |\n${value.split("\n").map(line => `  ${line}`).join("\n")}\n`
          } else {
            cleanedContent += `${key}: ${JSON.stringify(value)}\n`
          }
        }
        cleanedContent += "---\n\n"
      }

      cleanedContent += privateBodyContent

      // Add links section if there are any links
      if (links.length > 0) {
        cleanedContent += "\n\n## Links\n\n"
        cleanedContent += "This note originally contained the following links:\n\n"
        for (const link of links) {
          cleanedContent += `- ${link}\n`
        }
      }

      // Strip private/ and public/ prefixes from wikilinks
      cleanedContent = cleanedContent.replace(/\[\[(?:private|public)\/([-\w\/\.]+)(\|[^\]]+)?\]\]/g, '[[$1$2]]')

      // Strip private/ and public/ prefixes from relative markdown links (not external URLs)
      cleanedContent = cleanedContent.replace(/(?<!:\/\/[^\s]*)\]\((?:private|public)\/([-\w\/\.]+)\)/g, ']($1)')

      // Ensure the directory exists
      await mkdir(dirname(publicFilePath), { recursive: true })

      // Write the cleaned file
      await writeFile(publicFilePath, cleanedContent, "utf-8")

      console.log(`✅ Extracted ${relativePath}`)
      extracted++

    } catch (error) {
      console.error(`❌ Error processing ${privateFilePath}:`, error instanceof Error ? error.message : error)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Extracted: ${extracted}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
}

// Run the extraction
extractPrivateMetadata().catch((error) => {
  console.error("💥 Fatal error:", error)
  process.exit(1)
})
