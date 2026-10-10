import { expect, test } from "vitest"
import { contributionCalendar } from "../src/lib/github-contributions.ts"

// 1 October 2025 was a Wednesday, and 5 October the Sunday after it.

test("the calendar puts each day in its week's column and its weekday's row, Sunday first", () => {
  const calendar = contributionCalendar([
    { date: "2025-10-01", count: 0, level: 0 },
    { date: "2025-10-04", count: 1, level: 1 },
    { date: "2025-10-05", count: 6, level: 3 },
    { date: "2025-10-06", count: 2, level: 2 },
  ])
  expect(calendar.map(({ date, week, weekday }) => ({ date, week, weekday }))).toEqual([
    { date: "2025-10-01", week: 0, weekday: 3 },
    { date: "2025-10-04", week: 0, weekday: 6 },
    { date: "2025-10-05", week: 1, weekday: 0 },
    { date: "2025-10-06", week: 1, weekday: 1 },
  ])
})

test("a day's date is a calendar day, the same in every time zone", () => {
  // The tests run in Los Angeles (vitest.config.ts), where midnight UTC on the 5th is the 4th.
  const [sunday] = contributionCalendar([{ date: "2025-10-05", count: 3, level: 2 }])
  expect(sunday!.weekday).toBe(0)
  expect(sunday!.label).toBe("3 contributions on Oct 5, 2025")
})

test("a day says how many contributions it had, in words", () => {
  const labels = contributionCalendar([
    { date: "2025-10-01", count: 0, level: 0 },
    { date: "2025-10-02", count: 1, level: 1 },
    { date: "2025-10-03", count: 12, level: 4 },
  ]).map((day) => day.label)
  expect(labels).toEqual([
    "No contributions on Oct 1, 2025",
    "1 contribution on Oct 2, 2025",
    "12 contributions on Oct 3, 2025",
  ])
})

test("a day's level is one of the five, whatever the API says", () => {
  const levels = contributionCalendar([
    { date: "2025-10-01", count: 0, level: -1 },
    { date: "2025-10-02", count: 9, level: 7 },
    { date: "2025-10-03", count: 2, level: 2.5 },
  ]).map((day) => day.level)
  expect(levels).toEqual([0, 4, 2])
})
