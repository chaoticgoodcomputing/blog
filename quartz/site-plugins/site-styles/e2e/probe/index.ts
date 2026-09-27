// A probe plugin (tests/harness/probe.mjs) standing in for a family plugin: it emits one rule in a
// `cgc` sublayer from `externalResources()`, the way ADR-0003 rule 11 has every `cgc-*` package
// emit its CSS. The rule is more specific than any the site writes for the same element, so only
// the stack's order can make the site's win. It also sets a property the site leaves alone, which
// shows the rule is live.
export const PROBE_CSS = `@layer cgc.probe {
  html body #quartz-root.page {
    max-width: 1px;
    --cgc-probe: applied;
  }
}`

export default function FamilyProbe() {
  return {
    name: "FamilyProbe",
    textTransform(_ctx: unknown, src: string) {
      return src
    },
    externalResources() {
      return { css: [{ content: PROBE_CSS, inline: true }], js: [], additionalHead: [] }
    },
  }
}
