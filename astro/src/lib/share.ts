// The ways a page offers to be shared, as icons under its header (src/components/ShareLinks.astro):
// two the page does itself, copying its address and showing it as a QR code, and the rest a link to
// a service's share intent, a page of the service's own that opens its composer with the page's
// address in it. On a phone, the service's app opens it, where it is installed: the intents are
// addresses the apps claim, so a link to one needs no script.

/** A way to share a page: what it is called, and the icon id it is drawn with. */
export interface ShareMethod {
  /** What it is called: its tooltip, and its name for a screen reader. */
  name: string
  /** An icon id: `mdi:qrcode`, `custom:bluesky`. */
  icon: string
  /** A service's: the address of its share intent for the page. The page's own have none. */
  href?: string
  /** The page's own: what pressing it does. */
  action?: "copy" | "qr"
}

/** The page to share: its title, and its whole address, on the site's domain. */
export interface SharedPage {
  title: string
  address: string
}

const withQuery = (base: string, query: Record<string, string>) => `${base}?${new URLSearchParams(query)}`

/** The ways to share a page, in the order they are drawn. */
export function shareMethods({ title, address }: SharedPage): ShareMethod[] {
  return [
    { name: "Copy link", icon: "mdi:link-variant", action: "copy" },
    { name: "QR code", icon: "mdi:qrcode", action: "qr" },
    {
      name: "Bluesky",
      icon: "custom:bluesky",
      // The composer takes the post's text alone, and makes a card of the address in it.
      href: withQuery("https://bsky.app/intent/compose", { text: `${title}\n\n${address}` }),
    },
    {
      name: "LinkedIn",
      icon: "mdi:linkedin",
      // LinkedIn takes the address alone, and reads the title and share card from the page itself.
      href: withQuery("https://www.linkedin.com/sharing/share-offsite/", { url: address }),
    },
    {
      name: "X",
      icon: "custom:x",
      href: withQuery("https://x.com/intent/post", { text: title, url: address }),
    },
  ]
}
