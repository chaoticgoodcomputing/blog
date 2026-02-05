#!/usr/bin/env node

import { readFileSync } from "fs"
import { parseStringPromise } from "xml2js"

const ATPROTO_IDENTIFIER = process.env.ATPROTO_IDENTIFIER
const ATPROTO_POST_KEY = process.env.ATPROTO_POST_KEY
const RSS_FILE = process.env.RSS_FILE
const BSKY_HANDLE = "chaoticgood.computer"

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
 * Upload an image blob and get the blob reference
 */
async function uploadImageBlob(accessJwt, did, imageUrl) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return null
    }

    const imageData = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

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
  // Fetch metadata for the URL
  console.log(`  📋 Fetching metadata...`)
  const metadata = await fetchUrlMetadata(url)

  const record = {
    $type: "app.bsky.feed.post",
    text: text,
    createdAt: new Date().toISOString(),
  }

  // Add external embed with metadata
  if (metadata) {
    const external = {
      uri: url,
      title: metadata.title,
      description: metadata.description,
    }

    // Upload thumbnail image if available
    if (metadata.image) {
      console.log(`  🖼️  Uploading thumbnail...`)
      const thumb = await uploadImageBlob(accessJwt, did, metadata.image)
      if (thumb) {
        external.thumb = thumb
      }
    }

    record.embed = {
      $type: "app.bsky.embed.external",
      external: external,
    }
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
  const response = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(BSKY_HANDLE)}&limit=50`,
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch Bluesky feed: ${response.status}`)
  }

  const { feed } = await response.json()
  const postedUrls = new Set()

  for (const item of feed) {
    const post = item.post
    // Skip reposts and replies
    if (item.reason || post.record.reply) {
      continue
    }

    // Extract URLs from post text
    const text = post.record.text
    const urlRegex = /https?:\/\/[^\s]+/g
    const matches = text.match(urlRegex)
    if (matches) {
      matches.forEach((url) => postedUrls.add(url.trim()))
    }
  }

  return postedUrls
}

/**
 * Main execution
 */
async function main() {
  if (!ATPROTO_IDENTIFIER || !ATPROTO_POST_KEY || !RSS_FILE) {
    throw new Error("Missing required environment variables")
  }

  console.log("Parsing RSS feed from:", RSS_FILE)
  const items = await parseRSS(RSS_FILE)
  console.log(`Found ${items.length} items in RSS feed`)

  console.log("Fetching already posted URLs from Bluesky...")
  const postedUrls = await getPostedUrls()
  console.log(`Found ${postedUrls.size} URLs already posted`)

  const { accessJwt, did } = await authenticate()
  console.log("Authenticated successfully")

  // Filter to only unposted items and reverse to chronological order (oldest first)
  const unpostedItems = items
    .filter((item) => !postedUrls.has(item.link[0]))
    .reverse()

  console.log(`Found ${unpostedItems.length} new items to post`)

  let newPosts = 0
  for (const item of unpostedItems) {
    const link = item.link[0]
    const title = item.title[0]

    console.log(`Posting item ${newPosts + 1}/${unpostedItems.length}: ${title}`)
    console.log(`  URL: ${link}`)

    const postText = `New blog post: "${title}"`

    try {
      await createPost(accessJwt, did, postText, link, title)
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
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
