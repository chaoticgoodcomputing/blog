// cgc-posthog: PostHog analytics, as this site ran them on Quartz 4 (#42, #44): honours Do Not
// Track, keeps v4's privacy options, and sends a `navigation` event, labelled by where the reader
// clicked, for every link the SPA router follows. Replaces Quartz core's `analytics`, which has no
// privacy options and no navigation events, so a site sets that to `null`.
//
// The plugin is a transformer only to reach externalResources(): it ships one script and renders
// nothing. The script is in posthog.inline.js.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import script from "./posthog.inline.js" with { type: "text" }

export interface Options {
  /** The PostHog project's API key, `phc_…`. Required. It is public: every page carries it. */
  apiKey: string
  /**
   * Where PostHog is reached: a cloud host (`https://us.i.posthog.com`, the default, or
   * `https://eu.i.posthog.com`), a self-hosted instance, or a reverse proxy's path such as `/ingest`.
   * The library is fetched from `<apiHost>/static/array.js`, or from PostHog's asset host when
   * `apiHost` is one of PostHog's own. A trailing slash is ignored.
   */
  apiHost: string
  /**
   * Where a navigation came from: CSS selectors, each mapped to the label a `navigation` event
   * carries as its `source` when the clicked link matches that selector or sits inside an element
   * that does. The first match in the map's order wins. A click that matches none is `other`.
   */
  navigationSources: Record<string, string>
}

const fail = (message: string): never => {
  throw new Error(`cgc-posthog: ${message}`)
}

// Checked where a throw fails the build: Quartz logs a plugin whose factory throws and builds on
// without it, which would ship a site with its analytics silently gone.
function settings(opts: Partial<Options> | undefined) {
  const { apiKey, apiHost = "https://us.i.posthog.com", navigationSources = {} } = opts ?? {}
  if (typeof apiKey !== "string" || !apiKey.trim()) fail(`set the "apiKey" option to your PostHog project's API key (phc_…)`)
  if (typeof apiHost !== "string" || !apiHost.trim()) fail(`"apiHost" must be PostHog's address, e.g. https://us.i.posthog.com`)
  if (typeof navigationSources !== "object" || navigationSources === null || Array.isArray(navigationSources)) {
    fail(`"navigationSources" must map CSS selectors to labels, e.g. { ".explorer": "explorer" }`)
  }
  for (const [selector, label] of Object.entries(navigationSources)) {
    if (!selector.trim() || typeof label !== "string" || !label.trim()) {
      fail(`"navigationSources" must map CSS selectors to labels; "${selector}" → ${JSON.stringify(label)} is not one`)
    }
  }
  return { apiKey: apiKey!.trim(), apiHost: apiHost.trim().replace(/\/+$/, ""), sources: navigationSources }
}

const PostHog: QuartzTransformerPlugin<Partial<Options>> = (opts) => ({
  name: "cgc-posthog",
  // A transformer with no hook at all is skipped by the loader, script and all.
  htmlPlugins: () => [],
  externalResources: (ctx) => {
    // Core's own PostHog would init PostHog a second time, without the privacy options, and count
    // every page twice.
    if ((ctx.cfg.configuration.analytics as { provider?: string } | null | undefined)?.provider === "posthog") {
      fail(`it replaces core's PostHog analytics: set configuration.analytics to null`)
    }
    return {
      js: [
        {
          loadTime: "afterDOMReady",
          contentType: "inline",
          // `<` escaped, so no option can close the script element it ends up in.
          script: `${script}\ncgcPostHog(${JSON.stringify(settings(opts)).replace(/</g, "\\u003c")})\n`,
        },
      ],
    }
  },
})

export default PostHog
