// The icons the graph draws on its nodes (#77, docs/adr/0004). Each came in the graph's index as an
// `<svg>` drawn when the site built, every mark in `currentColor`: nothing is fetched for one (v4
// fetched each from a CDN, util/iconService.ts). A canvas draws images, so each icon becomes an image
// in the colour it is drawn in, the SVG's `color` set to it. The colour changes with the scheme, so an
// icon has one image per colour it has been drawn in.

export class IconImages {
  private readonly images = new Map<string, HTMLImageElement>()
  // Each icon's image last loaded, whatever its colour: drawn while the one asked for loads, so a
  // scheme switch never blanks an icon for a frame.
  private readonly loaded = new Map<string, HTMLImageElement>()

  constructor(private readonly svgs: Record<string, string>) {}

  /**
   * The icon an id names, in `colour`, ready to draw: the image in that colour once it has loaded,
   * the one drawn before until then, and null before any has loaded or for an icon the index lacks.
   */
  image(id: string, colour: string): HTMLImageElement | null {
    const svg = this.svgs[id]
    if (svg === undefined) return null
    const key = `${colour}\n${id}`
    let image = this.images.get(key)
    if (!image) {
      const created = new Image()
      created.onload = () => this.loaded.set(id, created)
      // `colour` is a resolved `rgba(…)`, which needs no escaping inside the attribute.
      const tinted = svg.replace(/^<svg\b/, `<svg color="${colour}"`)
      created.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tinted)}`
      this.images.set(key, (image = created))
    }
    return image.complete && image.naturalWidth > 0 ? image : (this.loaded.get(id) ?? null)
  }
}
