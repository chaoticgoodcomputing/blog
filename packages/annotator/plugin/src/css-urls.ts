// Stylesheets moved from where they were written: their relative `url(…)`s made absolute against
// where they came from, so their fonts and images are found from wherever they are put.

export function absoluteUrls(css: string, base: string): string {
  return css.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/g, (whole, quote: string, url: string) => {
    if (/^(data|blob):/i.test(url) || url.startsWith("#")) return whole
    try {
      return `url(${quote}${new URL(url, base).href}${quote})`
    } catch {
      return whole
    }
  })
}
