// The ring of one tag's badge in a cgc-tag-list, which every spec of the plugin reads a tag's colour
// and icon from. Not a spec: shared by the ones beside it.
// What v4 fetched each icon from, which no icon is fetched from now: jsDelivr (`@mdi/svg`), Iconify's
// API, or `/static/icons/` for the site's own.
export const ICON_REQUEST = /\.svg\b|@mdi\/|iconify|\/icons\//i

export const ring = (page, tag) =>
  page.locator(`.cgc-tag-list__item[data-tag="${tag}"] .cgc-tag-list__ring`)
