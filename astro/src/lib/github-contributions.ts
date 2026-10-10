// A GitHub user's year of contributions, as the GitHub card on the home page draws it. GitHub's own
// contribution calendar is only in its GraphQL API, which wants a token, so the browser asks
// github-contributions-api.jogruber.de, which reads the public profile page and answers anyone, as
// the Quartz site's card did. Nothing here touches the DOM, so it runs anywhere `fetch` does.

/** The contributions API: `<API><username>?y=last` is the user's last year. */
export const CONTRIBUTIONS_API = "https://github-contributions-api.jogruber.de/v4/"

/** One day, as the API grades it: `level` is how busy it was, from 0 to 4. */
export interface ContributionDay {
  /** A calendar day, `YYYY-MM-DD`, with no time zone. */
  date: string
  count: number
  level: number
}

/** The API's answer for `?y=last`. */
export interface ContributionYear {
  total: { lastYear: number }
  contributions: ContributionDay[]
}

/** One cell of the calendar: a day, where it goes, and what it says. */
export interface CalendarDay {
  date: string
  count: number
  /** 0 to 4. */
  level: number
  /** Its column: the week, counted from the first day's. */
  week: number
  /** Its row: 0 for Sunday to 6 for Saturday. */
  weekday: number
  /** "3 contributions on Oct 5, 2025". */
  label: string
}

// A contribution's date is a calendar day, so it is read and named in UTC, and is the same day
// wherever the reader is.
const dayOf = (date: string) => new Date(`${date}T00:00:00Z`)
const named = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

function label({ date, count }: ContributionDay): string {
  const how = count === 0 ? "No contributions" : `${count} contribution${count === 1 ? "" : "s"}`
  return `${how} on ${named(dayOf(date))}`
}

/** The days, oldest first, laid out as GitHub lays out its calendar: a column a week, Sunday on top. */
export function contributionCalendar(days: ContributionDay[]): CalendarDay[] {
  let week = 0
  return days.map((day, index) => {
    const weekday = dayOf(day.date).getUTCDay()
    if (index > 0 && weekday === 0) week++
    const level = Math.min(4, Math.max(0, Math.trunc(Number(day.level)) || 0))
    return { date: day.date, count: day.count, level, week, weekday, label: label(day) }
  })
}

/** The user's last year of contributions. Rejects with why, or with the signal's reason when aborted. */
export async function getContributions(
  username: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<ContributionYear> {
  const response = await fetch(`${CONTRIBUTIONS_API}${encodeURIComponent(username)}?y=last`, { signal })
  if (!response.ok) throw new Error(`The contributions API answered ${response.status}`)
  return (await response.json()) as ContributionYear
}
