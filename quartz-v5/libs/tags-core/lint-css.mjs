// The library-CSS check (ADR-0003's libraries-that-ship-CSS amendment) on the tag bubble's
// stylesheet: the check every styled package runs, @chaoticgoodcomputing/css-check, run here as a
// lint, since a library has no build. It rewrites nothing, so the shipped CSS is exactly the source.
// Every selector starts at, and stays within, the bubble's block, `cgc-tag-bubble`; the stylesheet
// takes skin only from the theme and declares no layer, since the plugin that ships it places it.
//
// It also holds the stylesheet to the palette `./bubble` publishes (BUBBLE_PALETTE), which a canvas
// paints bubbles from: the block's own rule paints its circle and its icon with exactly those
// properties, so the DOM's bubble and a canvas's can't drift apart. The badge modifier's rule paints
// its circle with BADGE_PALETTE's.
//
// Usage: node --experimental-strip-types lint-css.mjs [src-dir]. Exits 1 and lists every problem.
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { checkStylesheet } from "@chaoticgoodcomputing/css-check"

const root = path.resolve(process.argv[2] ?? "src")
const shown = (file) =>
  path.relative(process.cwd(), file).startsWith("..") ? file : path.relative(process.cwd(), file)
const { TAG_BUBBLE, BUBBLE_PALETTE, BADGE_PALETTE } = await import(
  pathToFileURL(path.join(root, "bubble.ts")).href
)

const file = path.join(root, "bubble.css")
const css = fs.readFileSync(file, "utf8")
const problems = checkStylesheet(css, { from: shown(file), block: TAG_BUBBLE.block })

// The declarations of one class's own rule, `.<class> { … }`, comments aside.
const bare = css.replace(/\/\*[\s\S]*?\*\//g, "")
const declarationsOf = (className) => {
  const own = new RegExp(`(?:^|})\\s*\\.${className}\\s*\\{([^}]*)\\}`).exec(bare)
  return new Map(
    (own?.[1] ?? "")
      .split(";")
      .map((declaration) => declaration.split(":").map((part) => part.trim()))
      .filter(([property, value]) => property && value)
      .map(([property, value]) => [property, value]),
  )
}
for (const [className, property, name] of [
  [TAG_BUBBLE.block, "background-color", BUBBLE_PALETTE.circle],
  [TAG_BUBBLE.block, "color", BUBBLE_PALETTE.icon],
  [TAG_BUBBLE.badge, "background-color", BADGE_PALETTE.circle],
]) {
  const want = `var(${name})`
  const have = declarationsOf(className).get(property)
  if (have !== want) {
    problems.push(
      `${shown(file)}  .${className} must paint with the palette ./bubble publishes: ${property}: ${want} (here: ${have ?? "none"})`,
    )
  }
}

if (problems.length) {
  console.error(
    `${problems.join("\n")}\n\n${problems.length} error${problems.length === 1 ? "" : "s"}: the bubble's stylesheet breaks ADR-0003 or its palette.`,
  )
  process.exit(1)
}
console.log(`${shown(file)} checked: inside its block, and painted with the bubble's palette.`)
