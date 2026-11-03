#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { pathToFileURL } from "url"
import { parseStringPromise } from "xml2js"

const ATPROTO_IDENTIFIER = process.env.ATPROTO_IDENTIFIER
const ATPROTO_POST_KEY = process.env.ATPROTO_POST_KEY
const RSS_FILE = process.env.RSS_FILE
const PAGES_DIR = process.env.PAGES_DIR || "pages-content"
const DRY_RUN_DIR = "content/public/assets/bsky-tests"
const BSKY_HANDLE = "chaoticgood.computer"

/** The most a post's text holds, in graphemes: Bluesky's limit. */
export const POST_LIMIT = 300

const graphemes = (text) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].map(({ segment }) => segment)

/**
 * A feed item's post text: its title, then as much of its description as fits under Bluesky's
 * limit, cut at a word and ended with an ellipsis where it doesn't all fit. The link card under it
 * says the rest.
 */
export function postText(title, description = "", limit = POST_LIMIT) {
  const head = `New blog post: "${title}"`
  const body = description.replace(/\s+/g, " ").trim()
  if (!body) return graphemes(head).slice(0, limit).join("")
  const whole = `${head}\n\n${body}`
  if (graphemes(whole).length <= limit) return whole
  const room = limit - graphemes(head).length - 2 - 1
  if (room < 20) return graphemes(head).slice(0, limit).join("")
  const cut = graphemes(body).slice(0, room).join("")
  const atWord = cut.replace(/\s+\S*$/, "")
  return `${head}\n\n${(atWord.length > room / 2 ? atWord : cut).replace(/[\s.,;:!?-]+$/, "")}…`
}

/**
 * Authenticate with Bluesky and get an access token
 */
async function authenticate() {
  const response = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: ATPROTO_IDENTIFIER,
      password: ATPROTO_POST_KEY,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Authentication failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  return { accessJwt: data.accessJwt, did: data.did }
}

/**
 * Fetch URL metadata (OG tags) for external embed
 */
async function fetchUrlMetadata(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }

    const html = await response.text()

    // Extract OG tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/)
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/)
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/)

    return {
      title: titleMatch ? titleMatch[1] : url,
      description: descMatch ? descMatch[1] : "",
      image: imageMatch ? imageMatch[1] : null,
    }
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${url}:`, error.message)
    return null
  }
}

/**
 * A note's share card in the pages checkout, the image its og:image names
 * (astro/src/lib/share-card.ts): https://blog.chaoticgood.computer/content/notes/example
 * has PAGES_DIR/share-cards/content/notes/example.png.
 */
function getOgImagePath(url) {
  const slug = new URL(url).pathname.replace(/\/$/, "")
  return join(PAGES_DIR, "share-cards", `${slug}.png`)
}

/**
 * Upload an image blob and get the blob reference
 * Accepts either a file path or a URL
 */
async function uploadImageBlob(accessJwt, did, imageSource) {
  try {
    let imageData
    let contentType = imageSource.endsWith(".png") ? "image/png" : "image/webp"

    // Check if it's a local file path
    if (!imageSource.startsWith("http")) {
      if (!existsSync(imageSource)) {
        console.warn(`Image file not found: ${imageSource}`)
        return null
      }
      imageData = await readFile(imageSource)
    } else {
      // Fetch from URL
      const response = await fetch(imageSource)
      if (!response.ok) {
        return null
      }
      imageData = await response.arrayBuffer()
      contentType = response.headers.get("content-type") || "image/webp"
    }

    // Upload to Bluesky
    const uploadResponse = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${accessJwt}`,
      },
      body: imageData,
    })

    if (!uploadResponse.ok) {
      return null
    }

    const { blob } = await uploadResponse.json()
    return blob
  } catch (error) {
    console.warn(`Failed to upload image:`, error.message)
    return null
  }
}

/**
 * Create a post on Bluesky with external link embed
 */
async function createPost(accessJwt, did, text, url, title, description) {
  const record = {
    $type: "app.bsky.feed.post",
    text: text,
    createdAt: new Date().toISOString(),
  }

  // Build external embed with title and description
  const external = {
    uri: url,
    title: title,
    description: description,
  }

  // Use OG image from pages branch checkout
  const ogImagePath = getOgImagePath(url)
  if (existsSync(ogImagePath)) {
    console.log(`  🖼️  Using OG image from pages: ${ogImagePath}`)
    const thumb = await uploadImageBlob(accessJwt, did, ogImagePath)
    if (thumb) {
      external.thumb = thumb
    }
  } else {
    console.warn(`  ⚠️  OG image not found: ${ogImagePath}`)
  }

  record.embed = {
    $type: "app.bsky.embed.external",
    external: external,
  }

  const response = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessJwt}`,
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record: record,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create post: ${response.status} ${error}`)
  }

  return await response.json()
}

/**
 * Parse RSS feed from file and return items
 */
function parseRSS(filePath) {
  const xml = readFileSync(filePath, "utf-8")
  return parseStringPromise(xml).then((parsed) => parsed.rss.channel[0].item || [])
}

/**
 * Fetch already posted URLs from Bluesky account feed
 */
async function getPostedUrls() {
  // Every post of the account, a page at a time, so that a feed item posted long ago is never
  // posted again.
  const feed = []
  let cursor
  do {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(BSKY_HANDLE)}&filter=posts_no_replies&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch Bluesky feed: ${response.status}`)
    }

    const page = await response.json()
    feed.push(...(page.feed ?? []))
    cursor = page.feed?.length ? page.cursor : undefined
  } while (cursor)

  const postedUrls = new Set()

  for (const item of feed) {
    const post = item.post
    // Skip reposts and replies
    if (item.reason || post.record.reply) {
      continue
    }

    // Extract URL from external embed (our posts use embeds, not text URLs)
    if (post.record.embed?.$type === "app.bsky.embed.external") {
      const url = post.record.embed.external?.uri
      if (url) {
        postedUrls.add(url)
      }
    }
  }

  return postedUrls
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRunMode = args.includes("--dry-run")

  if (!ATPROTO_IDENTIFIER || !ATPROTO_POST_KEY || !RSS_FILE) {
    throw new Error("Missing required environment variables")
  }

  console.log("Parsing RSS feed from:", RSS_FILE)
  console.log(`   Mode: ${dryRunMode ? "DRY RUN" : "LIVE"}`)
  const items = await parseRSS(RSS_FILE)
  console.log(`Found ${items.length} items in RSS feed`)

  console.log("Fetching already posted URLs from Bluesky...")
  const postedUrls = await getPostedUrls()
  console.log(`Found ${postedUrls.size} URLs already posted`)

  let accessJwt, did

  if (dryRunMode) {
    console.log("Dry-run mode: skipping authentication")
  } else {
    const auth = await authenticate()
    accessJwt = auth.accessJwt
    did = auth.did
    console.log("Authenticated successfully")
  }

  // Filter to only unposted items and reverse to chronological order (oldest first)
  const unpostedItems = items
    .filter((item) => !postedUrls.has(item.link[0]))
    .reverse()

  console.log(`Found ${unpostedItems.length} new items to post`)

  if (dryRunMode) {
    // Dry-run mode: generate the exact records that would be posted
    if (!existsSync(DRY_RUN_DIR)) {
      await mkdir(DRY_RUN_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
    const outputFile = join(DRY_RUN_DIR, `bluesky-${timestamp}.json`)

    const dryRunData = {
      timestamp: new Date().toISOString(),
      total_rss_items: items.length,
      already_posted: postedUrls.size,
      new_posts: unpostedItems.length,
      posts: unpostedItems.map((item) => {
        const link = item.link[0]
        const title = item.title[0]
        const description = item.description?.[0] || ""
        const text = postText(title, description)
        const ogImagePath = getOgImagePath(link)

        // Build the exact record that would be posted to Bluesky
        const record = {
          $type: "app.bsky.feed.post",
          text: text,
          createdAt: new Date().toISOString(),
          embed: {
            $type: "app.bsky.embed.external",
            external: {
              uri: link,
              title: title,
              description: description,
              og_image_path: ogImagePath,
            },
          },
        }

        return record
      }),
    }

    await writeFile(outputFile, JSON.stringify(dryRunData, null, 2), "utf-8")

    console.log(`\n✅ Dry-run output saved to: ${outputFile}`)
    console.log(`\nWould post ${unpostedItems.length} items:`)
    unpostedItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.title[0]}`)
      console.log(`     ${item.link[0]}`)
      console.log(`     OG image: ${getOgImagePath(item.link[0])}`)
    })
  } else {
    // Live mode: actually post to Bluesky
    let newPosts = 0
    for (const item of unpostedItems) {
      const link = item.link[0]
      const title = item.title[0]
      const description = item.description?.[0] || ""

      console.log(`Posting item ${newPosts + 1}/${unpostedItems.length}: ${title}`)
      console.log(`  URL: ${link}`)

      try {
        await createPost(accessJwt, did, postText(title, description), link, title, description)
        newPosts++
        console.log(`  ✓ Posted successfully`)

        // Rate limiting: createRecord costs 3 points, limit is 5000 points/hour = 1666 creates/hour
        // Wait 3 seconds between posts to stay well under the limit (~1200 posts/hour max)
        if (newPosts < unpostedItems.length) {
          console.log(`  ⏱️  Waiting 3 seconds before next post...`)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      } catch (error) {
        console.error(`  ✗ Failed to post: ${error.message}`)
        // Continue with other posts even if one fails
      }
    }

    console.log(`\nPosted ${newPosts} new items to Bluesky`)
    // The deploy's next job deploys again when this one posted, so the new notes' pages link to
    // their posts (astro/src/lib/bluesky-posts.ts).
    if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `posted=${newPosts}\n`, { flag: "a" })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
}
