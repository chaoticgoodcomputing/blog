import { expect, test } from "vitest"
import { hasIcon, iconName } from "../src/lib/icons.ts"
import { listedTags, tagColor, tagIcon, unknownIcons, unresolvedTags, unusedEntries } from "../src/lib/tag-dictionary.ts"

// A dictionary of its own, so that what is tested is the rule and not the site's entries.
const dictionary = {
  engineering: { color: "light-dark(#0070cc, #008CFF)", icon: "mdi:wrench" },
  "engineering/ai": { icon: "mdi:robot" },
  "engineering/ai/agents": { color: "var(--secondary)" },
  projects: { color: "red" },
  "projects/games": { icon: "custom:d20" },
}

test("a tag's colour is its own, else its nearest ancestor's", () => {
  expect(tagColor("engineering", dictionary)).toBe("light-dark(#0070cc, #008CFF)")
  expect(tagColor("engineering/ai", dictionary)).toBe("light-dark(#0070cc, #008CFF)")
  expect(tagColor("engineering/ai/agents", dictionary)).toBe("var(--secondary)")
  expect(tagColor("engineering/ai/agents/swarms", dictionary)).toBe("var(--secondary)")
  expect(tagColor("projects/games/roblox", dictionary)).toBe("red")
})

test("a tag's icon is its own icon id, else its nearest ancestor's", () => {
  expect(tagIcon("engineering", dictionary)).toBe("mdi:wrench")
  expect(tagIcon("engineering/ai", dictionary)).toBe("mdi:robot")
  expect(tagIcon("engineering/ai/agents", dictionary)).toBe("mdi:robot")
  expect(tagIcon("projects/games/roblox", dictionary)).toBe("custom:d20")
})

test("a tag with nothing in its lineage has no colour and no icon", () => {
  expect(tagColor("gardening/roses", dictionary)).toBeUndefined()
  expect(tagIcon("gardening/roses", dictionary)).toBeUndefined()
  // An ancestor that has a colour and no icon gives its colour only.
  expect(tagIcon("projects/homelab", dictionary)).toBeUndefined()
  // A tag that merely starts with an entry's name is not under it.
  expect(tagColor("engineers", dictionary)).toBeUndefined()
})

test("the site's dictionary is the one the Quartz site configured", () => {
  expect(tagColor("engineering/languages/typescript")).toBe("light-dark(#0070cc, #008CFF)")
  expect(tagIcon("engineering/languages/typescript")).toBe("mdi:language-typescript")
  expect(tagColor("projects/site/plugins")).toBe("light-dark(#cc0000, #FF0000)")
  expect(tagIcon("projects/site/plugins")).toBe("custom:quartz-filled")
  expect(tagColor("private")).toBe("light-dark(#cc0000, #FF0000)")
  expect(tagIcon("writing/annotations/meetings")).toBe("mdi:account-group")
  expect(tagColor("horticulture/seasons/rhythm")).toBe("light-dark(#1a8a1a, #00FF00)")
  expect(tagIcon("economics/strategy")).toBe("mdi:arrow-decision")
})

test("a note's tags are listed as written, or with each one's parents before it", () => {
  const tags = ["writing/articles", "engineering/languages/typescript", "engineering/ai"]
  expect(listedTags(tags, { showParents: false })).toEqual(tags)
  expect(listedTags(tags, { showParents: true })).toEqual([
    "writing",
    "writing/articles",
    "engineering",
    "engineering/languages",
    "engineering/languages/typescript",
    "engineering/ai",
  ])
  // A parent the note also carries is listed once, where it first comes.
  expect(listedTags(["engineering/ai", "engineering"], { showParents: true })).toEqual(["engineering", "engineering/ai"])
})

test("a tag in use is unresolved when neither it nor any tag above it has an entry, each once", () => {
  expect(unresolvedTags(["engineering/ai/agents/swarms", "gardening", "gardening/herbs", "gardening", "projects"], dictionary)).toEqual([
    "gardening",
    "gardening/herbs",
  ])
  expect(unresolvedTags(["engineering", "projects/games/roblox"], dictionary)).toEqual([])
})

test("a dictionary entry is unused when no tag in use is it or under it", () => {
  // `engineering` and `engineering/ai` are used through `engineering/ai/agents/swarms`; nothing is
  // under `projects`.
  expect(unusedEntries(["engineering/ai/agents/swarms", "gardening"], dictionary)).toEqual([
    "projects",
    "projects/games",
  ])
  expect(unusedEntries(["engineering/ai/agents", "projects/games/roblox"], dictionary)).toEqual([])
})

test("an icon id names an icon of Material Design Icons, or one of the site's own SVG files", () => {
  expect(hasIcon("mdi:robot")).toBe(true)
  expect(hasIcon("mdi:language-typescript")).toBe(true)
  for (const own of ["d20", "quartz-filled", "roblox", "uofu"]) expect(hasIcon(`custom:${own}`), own).toBe(true)
})

test("an icon id no collection has, or that is no icon id, names nothing", () => {
  expect(hasIcon("mdi:no-such-icon")).toBe(false)
  expect(hasIcon("custom:no-such-icon")).toBe(false)
  expect(hasIcon("fa:robot")).toBe(false)
  expect(hasIcon("robot")).toBe(false)
  expect(hasIcon("custom:../icons/d20")).toBe(false)
})

test("astro-icon draws an installed set's icon by its id, and the site's own by its file's name", () => {
  expect(iconName("mdi:robot")).toBe("mdi:robot")
  expect(iconName("custom:d20")).toBe("d20")
})

test("a dictionary entry whose icon id no collection has is found, by its tag", () => {
  const only = (ids: string[]) => (id: string) => ids.includes(id)
  expect(unknownIcons(only(["mdi:wrench", "custom:d20"]), dictionary)).toEqual([["engineering/ai", "mdi:robot"]])
  expect(unknownIcons(only(["mdi:wrench", "mdi:robot", "custom:d20"]), dictionary)).toEqual([])
})

test("every icon id in the site's dictionary names an icon", () => {
  expect(unknownIcons(hasIcon)).toEqual([])
})
