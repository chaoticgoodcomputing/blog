#!/usr/bin/env node

import { globby } from "globby"
import matter from "gray-matter"
import { mkdir, readFile, writeFile, unlink, copyFile } from "fs/promises"
import { dirname, relative, join } from "path"
import { existsSync } from "fs"
import { spawn } from "child_process"

const PRIVATE_DIR = "private"
const PRIVATE_SCRUB_SCRIPT = join(PRIVATE_DIR, "scrub.mjs")
const PRIVATE_DIST_CONTENT_DIR = join(PRIVATE_DIR, "dist", "content")
const PUBLIC_CONTENT_DIR = "public/content"
const PUBLIC_DIR = "public"

function runScrub() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [PRIVATE_SCRUB_SCRIPT], { stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`scrub.mjs exited with code ${code}`))
    })
  })
}

async function cleanupPrivateTaggedFiles() {
  console.log("\n🧹 Cleaning up existing private-tagged files in public...")

  const publicFiles = await globby([`${PUBLIC_DIR}/**/*.md`], {
    ignore: ["**/node_modules/**", "**/.git/**", "**/templates/**"],
  })

  let deleted = 0

  for (const publicFilePath of publicFiles) {
    try {
      const content = await readFile(publicFilePath, "utf-8")
      const { data: frontmatter } = matter(content)

      const tags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : frontmatter.tags
          ? [frontmatter.tags]
          : []

      if (tags.includes("private")) {
        await unlink(publicFilePath)
        deleted++
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`  ⚠️  Error checking ${publicFilePath}:`, error instanceof Error ? error.message : error)
      }
    }
  }

  console.log(`  ✅ Removed ${deleted} private-tagged file(s)`)
}

async function copyDistToPublic() {
  console.log("\n📤 Copying scrubbed content into public/...")

  const files = await globby([`${PRIVATE_DIST_CONTENT_DIR}/**/*.md`])

  let copied = 0
  for (const filePath of files) {
    const rel = relative(PRIVATE_DIST_CONTENT_DIR, filePath)
    const destPath = join(PUBLIC_CONTENT_DIR, rel)
    await mkdir(dirname(destPath), { recursive: true })
    await copyFile(filePath, destPath)
    copied++
  }

  console.log(`  ✅ Copied ${copied} file(s) to ${PUBLIC_CONTENT_DIR}/`)
}

async function main() {
  if (!existsSync(PRIVATE_DIR) || !existsSync(PRIVATE_SCRUB_SCRIPT)) {
    console.log("⚠️  Private submodule not available; skipping sync.")
    console.log("ℹ️  This is expected in CI environments without access to the private submodule.")
    return
  }

  await runScrub()

  if (!existsSync(PRIVATE_DIST_CONTENT_DIR)) {
    console.log("\n⚠️  Scrub produced no dist/content output; skipping public sync.")
    return
  }

  await cleanupPrivateTaggedFiles()
  await copyDistToPublic()

  console.log("\n✨ Vault sync complete.")
}

main().catch((error) => {
  console.error("💥 Fatal error:", error)
  process.exit(1)
})
