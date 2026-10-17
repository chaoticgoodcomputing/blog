// A widget in an MDX note that names an attachment by its address gets the attachment's own.
//
// The vault's MDX notes are written for Quartz too (docs/adr/0005), which publishes an attachment at
// its path lower-cased: a viewer asks for `/assets/thesis_draft.pdf`, and the file is
// `assets/Thesis_Draft.pdf`. A static host tells the two apart. So a component's text prop
// that starts with `/` and names a published attachment, in any case, as a link from the vault's
// root would, is given the URL the site publishes that attachment at. Anything else is left as
// written.

import { decodeLinkUrl, parseLinktext } from "@chaoticgoodcomputing/obsidian-markdown"
import { defineHastPlugin, type HastVisitorContext, type PluginFactoryContext } from "satteri"
import { isFromSiteRoot, publishedAttachments } from "./attachments.ts"
import { importedComponents, type JsxElement } from "./islands.ts"
import { urlOf } from "./notes.ts"
import { getVault } from "./vault.ts"

/**
 * The URL a page writes for the attachment a root-relative address names, percent-encoded as
 * `urlOf` writes it, or undefined for none. The address is the author's, so it is decoded as a
 * link's is, where a `%` that starts no escape is a character of a file's name; not as a request's
 * URL is, by `attachmentAddressOf`, which a URL the site writes never needs that for.
 */
function publishedUrlOf(written: string): string | undefined {
  // Only an address on the site can name an attachment. Which one is found as a link from the
  // vault's root finds its file, in any case, so the address is read as a link.
  if (!isFromSiteRoot(written)) return undefined
  const { path, subpath } = parseLinktext(decodeLinkUrl(written))
  const vault = getVault()
  const file = vault.metadataCache.getFirstLinkpathDest(path, "")
  if (!file || !publishedAttachments().has(`/${file.path}`)) return undefined
  return `${urlOf(file)}${subpath}`
}

/** A hast plugin per document: only an MDX note has components. */
export function widgetAddresses() {
  return ({ source, sourceFormat }: PluginFactoryContext) => {
    if (sourceFormat !== "mdx") return null
    const filter = [...importedComponents(source)]
    if (filter.length === 0) return null

    const visit = (node: JsxElement, ctx: HastVisitorContext) => {
      for (const attribute of node.attributes) {
        if (attribute.type !== "mdxJsxAttribute" || !attribute.name || typeof attribute.value !== "string") continue
        const url = publishedUrlOf(attribute.value)
        if (url !== undefined && url !== attribute.value) {
          ctx.setProperty(node as never, attribute.name, url)
        }
      }
    }

    return defineHastPlugin({
      name: "widget-addresses",
      mdxJsxFlowElement: { filter, visit: (node, ctx) => visit(node as unknown as JsxElement, ctx) },
      mdxJsxTextElement: { filter, visit: (node, ctx) => visit(node as unknown as JsxElement, ctx) },
    })
  }
}
