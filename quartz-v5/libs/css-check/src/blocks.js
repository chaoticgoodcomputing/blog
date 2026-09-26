// Which BEM block a name belongs to.
//
// A block's namespace is its name and what follows one of its separators: `__` and `--` for a class
// (`cgc-social__card`, `cgc-social--open`), `-` for every other name it defines (custom properties,
// keyframes, anchor names). Two blocks can nest: `cgc-bluesky-` is a prefix of everything in
// `cgc-bluesky-post`'s namespace. So a name belongs to the block whose namespace holds it most
// narrowly, the longest block that matches, and a stylesheet owns only its own blocks' names.

export const CLASS = ["__", "--"]
export const NAME = ["-"]

/**
 * The blocks one stylesheet styles, and the others it must keep clear of.
 * @typedef {object} Blocks
 * @property {readonly string[]} own  The stylesheet's own blocks.
 * @property {readonly string[]} all  Its own and its neighbours', for deciding who owns a name.
 */

/**
 * @param {string | readonly string[]} block
 * @param {readonly string[]} [neighbours]
 * @returns {Blocks}
 */
export function blocksOf(block, neighbours = []) {
  const own = typeof block === "string" ? [block] : [...block]
  if (!own.length) throw new Error("css-check: a stylesheet needs at least one block")
  return { own, all: [...own, ...neighbours.filter((b) => !own.includes(b))] }
}

/**
 * The block whose namespace holds `name` most narrowly, if any does.
 * @param {string} name
 * @param {readonly string[]} blocks
 * @param {readonly string[]} separators
 * @returns {string | undefined}
 */
export function ownerOf(name, blocks, separators) {
  let owner
  for (const block of blocks) {
    const inside = name === block || separators.some((sep) => name.startsWith(block + sep))
    if (inside && (owner === undefined || block.length > owner.length)) owner = block
  }
  return owner
}

/**
 * Whether `name` is in one of the stylesheet's own blocks' namespaces.
 * @param {string} name
 * @param {Blocks} blocks
 * @param {readonly string[]} separators
 */
export function isOurs(name, blocks, separators) {
  const owner = ownerOf(name, blocks.all, separators)
  return owner !== undefined && blocks.own.includes(owner)
}

/**
 * Why `name` isn't ours, for a problem's message: whose it is instead, or whose it should be.
 * @param {string} name  As the stylesheet writes it: `.cgc-x__y`, `--cgc-x-y`, `cgc-x-spin`.
 * @param {string} bare  The name inside its namespace: `cgc-x__y`, `cgc-x-y`, `cgc-x-spin`.
 * @param {Blocks} blocks
 * @param {readonly string[]} separators
 * @param {string} [sigil]  What the stylesheet writes before a name of this kind: `.` or `--`.
 */
export function notOurs(name, bare, blocks, separators, sigil = "") {
  const owner = ownerOf(bare, blocks.all, separators)
  if (owner) return `${name} is in ${owner}'s namespace, not ${blocks.own.join("'s or ")}'s`
  const namespaces = blocks.own.map((b) => `${sigil}${b}${separators[0]}…`).join(" or ")
  return `${name} is outside this block's namespace (${namespaces})`
}
