// The site's root path, from `baseUrl`: `/` for `blog.chaoticgood.computer`, `/garden/` for a site
// under a path. Links to it are absolute, as v4's were, because the 404 page is served from whatever
// depth a missing URL has, where a path relative to the page would miss. Core's Head does the same
// for the 404 page's resources.
export function siteRoot(baseUrl: string | undefined): string {
  const { pathname } = new URL(`https://${baseUrl ?? "example.com"}`)
  return pathname.endsWith("/") ? pathname : `${pathname}/`
}
