// Where the build writes a page. The site builds one file per page (`build.format: "file"`,
// astro.config.ts), so `/a` is `a.html` and the home page `index.html`. Everything that reads the
// built pages back finds them here, so a change to that setting changes this module alone.

/** A page's file in the build's output folder, from its address, percent-encoded or not. */
export function builtFileOf(url: string): string {
  if (url === "/") return "index.html"
  return `${decodeURI(url).slice(1)}.html`
}
