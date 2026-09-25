// cgc-posthog's browser script. Shipped as text: index.ts wraps this function in a call with the
// site's settings, and core extracts the result into a script at the end of every page's body, so it
// runs once per document, before Quartz's router dispatches the first `nav`. Plain browser script:
// no import or export, and nothing it needs from outside but its one argument.
//
// v4's PostHog customization (FORK-LEDGER: componentResources.ts, Spa.inline.ts):
//   - Do Not Track set → PostHog is never loaded, so nothing is sent;
//   - v4's privacy options: `ip: false`, no session recording, localStorage persistence;
//   - a `$pageview` on every `nav`, the first load's included;
//   - a `navigation` event for every link click the SPA router follows, labelled by the first
//     selector in `sources` that the link matches, or sits inside, else "other".
function cgcPostHog({ apiKey, apiHost, sources }) {
  // Wherever a browser has reported it: the standard place, then old Safari's and old IE's.
  const doNotTrack = [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack].some(
    (value) => value === "1" || value === "yes",
  )
  if (doNotTrack) return

  // PostHog's snippet, as v4 and Quartz core carry it, with its current asset host: it defines
  // `window.posthog` as a queue of calls, and its `init` fetches the library, which replays them.
  // prettier-ignore
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(apiKey, {
    api_host: apiHost,
    // Counted below, once per page shown: PostHog's own would miss every SPA navigation.
    capture_pageview: false,
    // No cookie.
    persistence: "localStorage",
    disable_session_recording: true,
    // v4's. The library ignores it now; an IP is dropped by the project's "Discard client IP data".
    ip: false,
  })

  // `window.posthog` is read at each call: the library replaces the snippet's queue when it loads.
  const capture = (event, properties) => window.posthog.capture(event, properties)

  document.addEventListener("nav", () => capture("$pageview", { path: location.pathname }))

  // The label for a click on `link`: the first source whose selector it matches or sits inside. A
  // selector the browser cannot parse matches nothing, rather than silencing every other source.
  const labelOf = (link) => {
    for (const [selector, label] of Object.entries(sources)) {
      try {
        if (link.closest(selector)) return label
      } catch {
        console.warn(`cgc-posthog: "${selector}" is not a selector the browser understands`)
      }
    }
    return "other"
  }

  // The clicks Quartz's SPA router follows, decided as its own click handler decides (core
  // spa.inline.ts `getOpts`), which runs after this one on the same event. Not followed: a click
  // with Ctrl or ⌘, on a target="_blank" element, on a `data-router-ignore` link, on a link off the
  // site, or on a link to a heading on the same page, which only scrolls.
  window.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element) || event.ctrlKey || event.metaKey) return
    if (target.getAttribute("target") === "_blank") return
    const link = target.closest("a")
    if (!link || "routerIgnore" in link.dataset) return
    let url
    try {
      url = new URL(link.href)
    } catch {
      return
    }
    if (url.origin !== location.origin) return
    if (url.pathname === location.pathname && url.hash) return
    capture("navigation", {
      source: labelOf(link),
      from_page: location.pathname,
      to_page: url.pathname,
      url: url.toString(),
    })
  })
}
