#!/usr/bin/env node

import { globby } from "globby"
import matter from "gray-matter"
import { mkdir, readFile, rename, rmdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { existsSync, readdirSync } from "fs"

const PUBLIC_DIR = "public"
const CONTENT_DIR = join(PUBLIC_DIR, "content")
const TAGS_DIR = join(PUBLIC_DIR, "tags")

async function collectTags() {
  console.log("Collecting tags from markdown files...")

  // Find all markdown files in content directory
  const markdownFiles = await globby([`${CONTENT_DIR}/**/*.md`])

  const tags = new Set()

  for (const file of markdownFiles) {
    const content = await readFile(file, "utf8")
    const { data } = matter(content)

    // Extract tags from frontmatter
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach(tag => {
        if (tag && typeof tag === "string") {
          tags.add(tag)
        }
      })
    }
  }

  console.log(`Found ${tags.size} unique tags`)

  // Expand tags to include all intermediate paths
  const allTags = new Set()
  for (const tag of tags) {
    const parts = tag.split("/")
    // Add all intermediate paths (e.g., "projects" and "projects/teaching")
    for (let i = 1; i <= parts.length; i++) {
      allTags.add(parts.slice(0, i).join("/"))
    }
  }

  console.log(`Expanded to ${allTags.size} total tag paths (including intermediates)`)
  return Array.from(allTags).sort()
}

// A tag's description file is `tags/<tag>.md`, where Quartz 5's tag page reads it (#43, #81). One
// left at v4's `tags/<tag>/index.md` is moved there, and its folder removed once empty, so a
// description written in the old place still reaches its tag page.
async function generateTagIndex(tag) {
  const indexPath = join(TAGS_DIR, `${tag}.md`)
  const legacyPath = join(TAGS_DIR, tag, "index.md")

  if (existsSync(legacyPath) && !existsSync(indexPath)) {
    await rename(legacyPath, indexPath)
    const legacyDir = dirname(legacyPath)
    if (readdirSync(legacyDir).length === 0) await rmdir(legacyDir)
    return { tag, created: false, moved: true }
  }

  // Check if the description file already exists
  if (existsSync(indexPath)) {
    return { tag, created: false }
  }

  // Get the tag name (use full tag path with # prefix)
  const tagName = `#${tag}`

  // Create the directory structure if needed
  await mkdir(dirname(indexPath), { recursive: true })

  // Create the index file with frontmatter (quoted to handle # prefix)
  const content = `---
title: "${tagName}"
---

`

  await writeFile(indexPath, content, "utf8")
  return { tag, created: true }
}

async function main() {
  try {
    // Collect all tags from markdown files
    const tags = await collectTags()
    // Every description still at v4's tags/<tag>/index.md, used by a post or not, so none is left behind.
    for (const legacy of await globby([`${TAGS_DIR}/**/index.md`])) {
      const tag = dirname(legacy).slice(TAGS_DIR.length + 1)
      if (tag && !tags.includes(tag)) tags.push(tag)
    }

    console.log("\nGenerating tag index pages...")

    // Generate index files for each tag
    const results = await Promise.all(
      tags.map(tag => generateTagIndex(tag))
    )

    // Report results
    const created = results.filter(r => r.created)
    const moved = results.filter(r => r.moved)
    const skipped = results.filter(r => !r.created && !r.moved)

    console.log(`\n✓ Created ${created.length} new tag index pages`)
    if (created.length > 0) {
      created.forEach(({ tag }) => console.log(`  - ${tag}`))
    }

    if (moved.length > 0) {
      console.log(`\n✓ Moved ${moved.length} tag index pages from tags/<tag>/index.md to tags/<tag>.md`)
      moved.forEach(({ tag }) => console.log(`  - ${tag}`))
    }

    console.log(`\n✓ Skipped ${skipped.length} existing tag index pages`)

  } catch (error) {
    console.error("Error generating tag indexes:", error)
    process.exit(1)
  }
}

main()
