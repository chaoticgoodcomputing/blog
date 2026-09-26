// CSS the check can't see: a stylesheet a source file imports from outside the checked tree. The
// consumer's bundler would inline it (esbuild does, for `import "x.css"`), so it would ship unchecked.
import path from "node:path"

// `import "x.css"`, `import x from "x.css"` and `import("x.css")`.
const CSS_IMPORT = /\bimport\s*(?:\(\s*|[^'"();]*?\bfrom\s*)?["']([^"']+\.css)["']/g

/**
 * @typedef {object} ImportOptions
 * @property {string} from  The source file's path, as a problem names it; a relative one is
 *   resolved from the working directory.
 * @property {string} root  The directory whose stylesheets the check sees.
 */

/**
 * Every stylesheet a source file imports that the check can't see: one from another package, or
 * one a relative path reaches outside `root`.
 * @param {string} source
 * @param {ImportOptions} options
 * @returns {string[]}  One line per problem, `file:line:column  message`; empty when there are none.
 */
export function checkImports(source, { from, root }) {
  /** @type {string[]} */
  const problems = []
  for (const match of source.matchAll(CSS_IMPORT)) {
    const specifier = match[1]
    if (specifier.startsWith(".")) {
      const within = path.relative(
        path.resolve(root),
        path.resolve(path.dirname(path.resolve(from)), specifier),
      )
      if (!within.startsWith("..") && !path.isAbsolute(within)) continue
    }
    const before = source.slice(0, match.index)
    const line = before.split("\n").length
    const column = before.length - before.lastIndexOf("\n")
    problems.push(
      `${from}:${line}:${column}  imports ${specifier}, a stylesheet from outside ${root}, which this check can't see`,
    )
  }
  return problems
}
