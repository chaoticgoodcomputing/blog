// The attachments the site publishes as they are, each at its path in the vault: every file of the
// vault that is neither a note nor an image, and each image a note links to rather than embeds. An
// embedded image is the image pipeline's, which publishes it optimised, at an address of its own.
// The attachments integration (src/integrations/attachments.ts) serves these in dev and copies them
// into the build. What the vault leaves out, its dotfiles and what git ignores, is no file of it
// (./vault.ts), so it is never published.

import fs from "node:fs/promises"
import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"
import { isImageFile, parseLinktext, type Vault, type VaultFile } from "@chaoticgoodcomputing/obsidian-markdown"
import sirv from "sirv"
import { getVault } from "./vault.ts"

/** The images some note links to with a link, as opposed to an embed. */
function linkedImages(vault: Vault): Set<string> {
  const linked = new Set<string>()
  for (const note of vault.getMarkdownFiles()) {
    for (const link of vault.metadataCache.getFileCache(note)?.links ?? []) {
      const linkpath = parseLinktext(link.link).path
      const destination = linkpath ? vault.metadataCache.getFirstLinkpathDest(linkpath, note.path) : null
      if (destination && isImageFile(destination)) linked.add(destination.path)
    }
  }
  return linked
}

/**
 * Every published attachment by its address, from the site's root and not percent-encoded, as the
 * server reads a request's path: `/assets/Thesis Draft.pdf`.
 */
export function attachmentAddresses(vault: Vault): Map<string, VaultFile> {
  const linked = linkedImages(vault)
  const addresses = new Map<string, VaultFile>()
  for (const file of vault.getFiles()) {
    if (vault.isNote(file) || (isImageFile(file) && !linked.has(file.path))) continue
    addresses.set(`/${file.path}`, file)
  }
  return addresses
}

/** Whether an address is from the site's root, `/…`, and not another host's, `//…`. */
export function isFromSiteRoot(address: string): boolean {
  return address.startsWith("/") && !address.startsWith("//")
}

/**
 * The attachment address an address on the site names, as `attachmentAddresses` keys it: a link's
 * `href` or a request's URL, with its query and fragment dropped and its path decoded. An address
 * that is not from the site's root, or that can't be decoded, names none: a URL the site writes
 * encodes a `%` of a file's name, as `urlOf` does.
 */
export function attachmentAddressOf(address: string): string | undefined {
  if (!isFromSiteRoot(address)) return undefined
  try {
    return decodeURIComponent(new URL(address, "http://site").pathname)
  } catch {
    return undefined
  }
}

// Worked out once per vault as it was last read: the dev server reads the vault again when a file in
// it changes (src/content.config.ts), and the next question is answered from the new one.
const addresses = new WeakMap<Vault, Map<string, VaultFile>>()

/**
 * Copies files into a build, each to its address under `out`, as a copy-on-write clone where the
 * disk can make one, which costs no space. A file is never copied over one the build already has
 * there: those addresses are returned, for the caller to say what that means.
 */
export async function copyIntoBuild(
  files: Iterable<[address: string, file: string]>,
  out: string,
): Promise<{ copied: number; taken: string[] }> {
  let copied = 0
  const taken: string[] = []
  for (const [address, file] of files) {
    const target = path.join(out, address)
    await fs.mkdir(path.dirname(target), { recursive: true })
    try {
      await fs.copyFile(file, target, fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE)
      copied++
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      taken.push(address)
    }
  }
  return { copied, taken }
}

/** The site's own published attachments, by address. */
export function publishedAttachments(): Map<string, VaultFile> {
  const vault = getVault()
  let found = addresses.get(vault)
  if (!found) addresses.set(vault, (found = attachmentAddresses(vault)))
  return found
}

/** A dev server's middleware, as Vite's server takes one (connect's). */
export type Middleware = (request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void) => void

/**
 * The dev server's middleware for the attachments: each one is served from its file in the vault
 * under `root`, as Vite serves `public/`, by sirv; any other request is passed on. `published` is
 * asked on every request, so an attachment the vault has since been read with is served too.
 */
export function serveAttachments(
  root: string,
  published: () => Map<string, VaultFile> = publishedAttachments,
): Middleware {
  const serve = sirv(root, { dev: true, etag: true })
  return (request, response, next) => {
    if (request.method !== "GET" && request.method !== "HEAD") return next()
    const address = attachmentAddressOf(request.url ?? "/")
    if (address === undefined || !published().has(address)) return next()
    serve(request, response, next)
  }
}
