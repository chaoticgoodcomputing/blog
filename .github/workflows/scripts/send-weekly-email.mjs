#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { basename, dirname, join } from "path"
import matter from "gray-matter"

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY
const BASE_URL = "https://blog.chaoticgood.computer"
const DRY_RUN_DIR = "content/public/assets/email-tests"

/**
 * Convert wikilinks to markdown links with full URLs
 * @param {string} content - Markdown content with wikilinks
 * @returns {string} Content with converted links
 */
function convertWikilinksToMarkdown(content) {
  // Convert [[path|display text]] to [display text](https://blog.chaoticgood.computer/path)
  return content.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (match, path, displayText) => {
    return `[${displayText}](${BASE_URL}/${path})`
  })
}

/**
 * Extract subject and body from weekly note
 * @param {string} content - The markdown content
 * @returns {{ subject: string, body: string }}
 */
function extractEmailContent(content) {
  // Find the first ### heading for the subject
  const subjectMatch = content.match(/^###\s+(.+)$/m)
  const subject = subjectMatch ? subjectMatch[1].trim() : "Weekly Update"

  // Remove the subject line from the body
  let body = content
  if (subjectMatch) {
    const subjectIndex = content.indexOf(subjectMatch[0])
    // Keep everything after the subject line, but trim leading/trailing whitespace
    body = content.slice(subjectIndex + subjectMatch[0].length).trim()
  }

  // Convert wikilinks to markdown links
  body = convertWikilinksToMarkdown(body)

  return { subject, body }
}

/**
 * Create an email via Buttondown API
 * @param {string} subject - Email subject
 * @param {string} body - Email body (markdown)
 * @param {boolean} isDraft - Whether to create as draft
 * @returns {Promise<object>} API response
 */
async function createEmail(subject, body, isDraft = false) {
  const response = await fetch("https://api.buttondown.com/v1/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${BUTTONDOWN_API_KEY}`,
    },
    body: JSON.stringify({
      subject,
      body,
      status: isDraft ? "draft" : "about_to_send",
      email_type: "public",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create email: ${response.status} ${error}`)
  }

  return await response.json()
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const fileIndex = args.indexOf("--file")
  const dryRunMode = args.includes("--dry-run")

  if (fileIndex === -1 || !args[fileIndex + 1]) {
    throw new Error("Missing required --file argument")
  }

  const filePath = args[fileIndex + 1]

  console.log(`📧 Processing weekly note: ${filePath}`)
  console.log(`   Mode: ${dryRunMode ? "DRY RUN" : "LIVE"}`)

  // Read the markdown file
  const fileContent = await readFile(filePath, "utf-8")
  const { data: frontmatter, content } = matter(fileContent)

  console.log(`   Title: ${frontmatter.title}`)
  console.log(`   Date: ${frontmatter.date}`)

  // Check if the note has the "private" tag
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : frontmatter.tags
      ? [frontmatter.tags]
      : []

  if (tags.includes("private")) {
    console.log(`\n⚠️  Note has "private" tag - skipping email send`)
    console.log(`   This note should not have been published publicly.`)
    process.exit(0)
  }

  // Extract subject and body
  const { subject, body } = extractEmailContent(content)

  console.log(`   Subject: ${subject}`)
  console.log(`   Body length: ${body.length} characters`)

  if (dryRunMode) {
    // Create dry-run output
    const emailData = {
      subject,
      body,
      status: "draft",
      email_type: "public",
      metadata: {
        source_file: filePath,
        source_title: frontmatter.title,
        source_date: frontmatter.date,
      },
    }

    // Generate filename from the note's date or title
    const noteId = frontmatter.date
      ? new Date(frontmatter.date).toISOString().split("T")[0]
      : basename(filePath, ".md")
    const outputFile = join(DRY_RUN_DIR, `${noteId}.json`)

    // Ensure directory exists
    if (!existsSync(DRY_RUN_DIR)) {
      await mkdir(DRY_RUN_DIR, { recursive: true })
    }

    await writeFile(outputFile, JSON.stringify(emailData, null, 2), "utf-8")

    console.log(`\n✅ Dry-run output saved to: ${outputFile}`)
    console.log(`\nEmail preview:`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Body:\n${body.slice(0, 200)}${body.length > 200 ? "..." : ""}`)
  } else {
    // Send the email via Buttondown
    if (!BUTTONDOWN_API_KEY) {
      throw new Error("Missing BUTTONDOWN_API_KEY environment variable")
    }

    console.log("\n📤 Sending email via Buttondown...")

    const result = await createEmail(subject, body, false)

    console.log(`\n✅ Email sent successfully!`)
    console.log(`   Email ID: ${result.id}`)
    console.log(`   URL: ${result.absolute_url}`)
    console.log(`   Status: ${result.status}`)
  }
}

main().catch((error) => {
  console.error("💥 Fatal error:", error)
  process.exit(1)
})
