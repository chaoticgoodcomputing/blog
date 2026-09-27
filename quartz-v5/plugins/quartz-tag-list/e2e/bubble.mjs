// The bubble of one tag's badge in a quartz-tag-list, which every spec of the plugin reads a tag's colour
// and icon from: tags-core's tag bubble (#82). Not a spec: shared by the ones beside it.
// What v4 fetched each icon from, which no icon is fetched from now: jsDelivr (`@mdi/svg`), Iconify's
// API, or `/static/icons/` for the site's own.
export const ICON_REQUEST = /\.svg\b|@mdi\/|iconify|\/icons\//i

export const bubble = (page, tag) =>
  page.locator(`.cgc-tag-list__item[data-tag="${tag}"] .cgc-tag-bubble`)
