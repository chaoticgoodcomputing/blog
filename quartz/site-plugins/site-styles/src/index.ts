// site-styles: this site's application CSS (ADR-0003's site-plugin amendment, #39), and its fonts
// (#84, ADR-0003's self-hosted-fonts amendment).
//
// Two factories, as quartz-tags has, because a plugin in two categories is instantiated once for each
// and one factory would emit the stylesheet twice. The loader picks each by its shape.
//
// - `transformer`, CSS only: everything it does is `externalResources()`, one stylesheet that opens
//   with the stack declaration, carries the site's five ITCSS tiers under the `site` layer, and
//   declares the site's fonts in the generic tier. It runs at `defaultOrder: -1000`, so that sheet
//   is the first named-layer statement on the page after core's `index.css`, which is what fixes
//   every layer's rank. `e2e/stack.spec.mjs` guards it.
// - `emitter`, which copies the font files into the site. `e2e/fonts.spec.mjs` guards both halves.
import siteCss from "./styles/site.scss"
import { emitFonts, fontFaces } from "./fonts"

type Ctx = Parameters<typeof fontFaces>[0]

export function transformer() {
  return {
    name: "SiteStyles",
    // The loader skips a transformer with no hook at all, so this one has a no-op.
    textTransform(_ctx: unknown, src: string) {
      return src
    },
    externalResources(ctx: Ctx) {
      return { css: [{ content: `${siteCss}\n${fontFaces(ctx)}`, inline: true }], js: [], additionalHead: [] }
    },
  }
}

export function emitter() {
  return {
    name: "SiteStylesFonts",
    emit: (ctx: Ctx) => emitFonts(ctx),
    // Under `serve`, output isn't cleaned between rebuilds, and nothing a rebuild changes moves a font.
    partialEmit: async () => null,
  }
}
