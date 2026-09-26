// GitHub in the suite. No spec reaches the real GitHub: a page that fetches from it, as cgc-social's
// GitHub card does in the browser, has its requests answered here instead.
//
// - `githubStandIn(context)` answers every request to the hosts the card reads (`GITHUB_HOSTS`):
//   GitHub's REST API for a user's profile, the contributions API v4's card read the calendar from
//   (github-contributions-api.jogruber.de), and GitHub's avatar host with one small picture. The
//   harness applies it to every browser context it hands a spec, so a page with the card shows the
//   fixture user's, and any other user is not found, as the real APIs say.
// - A spec about a failure routes the host itself: a page's routes take precedence over its
//   context's, so `page.route(CONTRIBUTIONS_API, …)` wins over the stand-in.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jsonResponse as json, routeStandIn } from "./stand-in.mjs"

/** Every host the GitHub card reads: the REST API, the contributions API and the avatar host. */
export const GITHUB_HOSTS =
  /^https:\/\/(api\.github\.com|github-contributions-api\.jogruber\.de|avatars\.githubusercontent\.com)\//
/** GitHub's REST API, where the card reads a user's profile. */
export const GITHUB_API = /^https:\/\/api\.github\.com\//
/** The contributions API, where the card reads a user's calendar. */
export const CONTRIBUTIONS_API = /^https:\/\/github-contributions-api\.jogruber\.de\//

const here = path.dirname(fileURLToPath(import.meta.url))
/** The stand-in's users: `USERS[login]` is the profile GitHub's REST API answers with. */
export const USERS = JSON.parse(fs.readFileSync(path.join(here, "../fixture-github/users.json"), "utf8"))

// The fixture user's year, from a Thursday to a Wednesday, so that the calendar's first and last
// weeks are partial, as a real year's are. Each day's level cycles 0, 3, 1, 4, 2, and its count
// follows from the level. What the stand-in answers for every user it holds.
const FIRST_DAY = Date.UTC(2024, 8, 26)
const DAYS = 364
const COUNT_OF_LEVEL = [0, 1, 3, 6, 10]

/** `github-contributions-api.jogruber.de/v4/<user>?y=last`'s answer for a user the stand-in holds. */
export const CONTRIBUTIONS = (() => {
  const contributions = Array.from({ length: DAYS }, (_, i) => {
    const level = (i * 3) % 5
    const date = new Date(FIRST_DAY + i * 86_400_000).toISOString().slice(0, 10)
    return { date, count: COUNT_OF_LEVEL[level], level }
  })
  const lastYear = contributions.reduce((sum, day) => sum + day.count, 0)
  return { total: { lastYear }, contributions }
})()

/** The response the stand-in gives to one request to either API, as `route.fulfill` takes it. */
export function githubResponse(url) {
  const { host, pathname } = new URL(url)
  if (host === "api.github.com") {
    const login = /^\/users\/([^/]+)$/.exec(pathname)?.[1]
    if (login && Object.hasOwn(USERS, login)) return json(200, USERS[login])
    return json(404, { message: "Not Found", documentation_url: "https://docs.github.com/rest" })
  }
  const login = /^\/v4\/([^/]+)$/.exec(pathname)?.[1]
  if (login && Object.hasOwn(USERS, login)) return json(200, CONTRIBUTIONS)
  // What the contributions API says for a user GitHub doesn't have.
  return json(404, { error: `GitHub user "${login}" not found.` })
}

// Every avatar is the stand-in's one picture.
export const githubStandIn = (context) =>
  routeStandIn(context, GITHUB_HOSTS, { imageHost: "avatars.githubusercontent.com", answer: (url) => githubResponse(url.href) })
