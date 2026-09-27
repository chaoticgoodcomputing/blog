// The GitHub card, in the browser: the user's profile from GitHub's REST API, and their year of
// contributions from the contributions API v4's card read, drawn as v4's calendar. Everything is built
// as DOM nodes, so what a profile says is text, never markup.
import { element, reasonOf } from "./block"
import { failed } from "./status"

const PROFILE_API = "https://api.github.com/users/"
const CONTRIBUTIONS_API = "https://github-contributions-api.jogruber.de/v4/"

interface Profile {
  login: string
  name?: string | null
  bio?: string | null
  avatar_url?: string
}

interface Day {
  date: string
  count: number
  level: number
}

interface Year {
  total: { lastYear: number }
  contributions: Day[]
}

// One request. Rejects with why, for a reader to see, or with the signal's reason when aborted.
async function get<T>(url: string, signal: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (signal.aborted) throw signal.reason
    throw new Error(`GitHub couldn't be reached (${reasonOf(error)})`)
  }
  const body = await response.json().catch(() => undefined)
  if (response.ok && body !== undefined) return body as T
  throw new Error(body?.error ?? `Failed to fetch (status: ${response.status})`)
}

// A URL a profile may load: http(s) only.
function safeUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === "https:" || protocol === "http:" ? url : undefined
  } catch {
    return undefined
  }
}

function profileOf(user: Profile, username: string): HTMLElement {
  const profile = element("div", "profile")
  const avatar = safeUrl(user.avatar_url)
  if (avatar) {
    const img = element("img", "avatar")
    img.src = avatar
    img.alt = ""
    profile.append(img)
  }
  const info = element("div", "profile-info")
  const name = element("a", "name", user.name || username)
  name.href = `https://github.com/${encodeURIComponent(username)}`
  name.target = "_blank"
  name.rel = "noopener noreferrer"
  info.append(name, element("p", "username", `@${username}`))
  if (user.bio) info.append(element("p", "bio", user.bio))
  profile.append(info)
  return profile
}

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""]
const dateOf = (day: Day) => new Date(`${day.date}T00:00:00Z`)
const named = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })

// v4's tooltip: "No contributions on Sep 21, 2025", "1 contribution on …", "6 contributions on …".
function tooltip(day: Day): string {
  const count = day.count === 0 ? "No contributions" : `${day.count} contribution${day.count === 1 ? "" : "s"}`
  return `${count} on ${named(dateOf(day))}`
}

// The year as weeks, Sunday first, read in UTC: a contribution's date is a calendar day, with no
// time zone. v4 read it in the reader's, then added a day, which put it a day late at or east of UTC.
function weeksOf(days: Day[]): Day[][] {
  const weeks: Day[][] = []
  for (const day of days) {
    if (dateOf(day).getUTCDay() === 0 || weeks.length === 0) weeks.push([])
    weeks[weeks.length - 1].push(day)
  }
  return weeks
}

// v4's calendar: a row per weekday, a column per week, each day coloured by its level.
function calendarOf(weeks: Day[][]): HTMLTableElement {
  const table = element("table", "calendar")
  const body = document.createElement("tbody")
  WEEKDAYS.forEach((label, weekday) => {
    const row = document.createElement("tr")
    row.append(element("td", "weekday", label))
    for (const week of weeks) {
      const day = week.find((d) => dateOf(d).getUTCDay() === weekday)
      if (!day) {
        row.append(element("td", "blank"))
        continue
      }
      const level = Math.min(4, Math.max(0, Math.trunc(Number(day.level)) || 0))
      const cell = element("td", `day day--level-${level}`)
      cell.title = tooltip(day)
      row.append(cell)
    }
    body.append(row)
  })
  table.append(body)
  return table
}

// As many of the newest weeks as fit the graph's width, as v4 showed. A graph with no width, in a
// card the page hides, keeps them all and scrolls.
function fit(graph: HTMLElement, table: HTMLTableElement) {
  if (graph.clientWidth === 0) return
  const rows = [...table.rows]
  while (table.offsetWidth > graph.clientWidth && rows[0].cells.length > 2) {
    for (const row of rows) row.cells[1].remove()
  }
}

export async function drawGitHub(card: HTMLElement, signal: AbortSignal) {
  const body = card.querySelector<HTMLElement>(".cgc-social__body")
  const username = card.dataset.username
  if (!body || !username) return
  const showProfile = card.dataset.showProfile !== "false"
  const showHeader = card.dataset.showHeader !== "false"
  const user = encodeURIComponent(username)

  try {
    const [profile, year] = await Promise.all([
      // v4 went on without the profile when GitHub didn't answer for it.
      showProfile
        ? get<Profile>(`${PROFILE_API}${user}`, signal).catch((error) => {
            if (signal.aborted) throw error
            return undefined
          })
        : undefined,
      get<Year>(`${CONTRIBUTIONS_API}${user}?y=last`, signal),
    ])
    const panel = element("div", "panel")
    if (profile) panel.append(profileOf(profile, username))
    if (showHeader)
      panel.append(element("p", "total", `${year.total.lastYear} contributions in the last year`))
    const graph = element("div", "graph")
    const table = calendarOf(weeksOf(year.contributions))
    graph.append(table)
    panel.append(graph)
    if (signal.aborted) return
    body.replaceChildren(panel)
    fit(graph, table)
  } catch (error) {
    if (signal.aborted) return
    body.replaceChildren(failed("Failed to load contributions", reasonOf(error)))
  }
}
