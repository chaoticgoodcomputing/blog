import { expect, test } from "../site.ts"

// The newsletter is the site's Buttondown list, chaoticgoodcomputing. Its form posts there, and no
// spec here reaches Buttondown: what a submission sends is caught by a stand-in.
const list = "https://buttondown.com/api/emails/embed-subscribe/chaoticgoodcomputing"

const note = "/subscribe-box/note"

test("under a note, the subscribe box has its heading, its line of text and the form", async ({ page }) => {
  await page.goto(note)
  const box = page.locator(".after-body .subscribe-box")
  await expect(box).toHaveCount(1)
  await expect(box.getByRole("heading")).toHaveText("Subscribe for more!")
  await expect(box.locator("p")).toHaveText("Be notified weekly about any fresh notes or articles!")

  const form = box.locator("form")
  await expect(form).toHaveAttribute("action", list)
  await expect(form).toHaveAttribute("method", "post")
  const address = form.getByRole("textbox", { name: "Email address" })
  await expect(address).toHaveAttribute("type", "email")
  await expect(address).toHaveAttribute("name", "email")
  await expect(address).toHaveAttribute("placeholder", "you@youmail.com")
  await expect(address).toHaveJSProperty("required", true)
  await expect(form.getByRole("button", { name: "Subscribe" })).toBeVisible()
})

test("the box's line of text is in the palette's dark grey, which reads against the box", async ({ page }) => {
  // --darkgray's light value, #4e4e4e; --gray's #b8b8b8 was 1.9:1 on the box's --light.
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(note)
  await expect(page.locator(".after-body .subscribe-box p")).toHaveCSS("color", "rgb(78, 78, 78)")
})

test("on the home page, the sidebar has the subscribe box, and nothing follows the body", async ({ page }) => {
  await page.goto("/")
  const box = page.locator("aside.right .subscribe-box")
  await expect(box).toHaveCount(1)
  // Headed as every sidebar section is.
  await expect(box.getByRole("heading", { level: 2 })).toHaveText("Newsletter")
  await expect(box.locator("p")).toHaveText("Weekly updates about any new notes!")
  await expect(box.locator("form")).toHaveAttribute("action", list)
  await expect(page.locator(".subscribe-box")).toHaveCount(1)
})

test("on a tag page, the sidebar has the subscribe box, and no box is under the body", async ({ page }) => {
  await page.goto("/tags/ledger")
  await expect(page.locator('aside.right .subscribe-box[data-box="sidebar"]')).toHaveCount(1)
  await expect(page.locator('.subscribe-box[data-box="underNote"]')).toHaveCount(0)
  await expect(page.locator(".after-body .subscribe-box")).toHaveCount(0)
})

test("a note's sidebar has no subscribe box", async ({ page }) => {
  await page.goto(note)
  await expect(page.locator("aside.right .subscribe-box")).toHaveCount(0)
})

test("the 404 page has neither box", async ({ page }) => {
  await page.goto("/nothing/at/all")
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText("404")
  await expect(page.locator(".subscribe-box")).toHaveCount(0)
})

test("an empty address is held back, and an address is sent to the list", async ({ page }) => {
  const sent: { url: string; method: string; body: string | null }[] = []
  await page.route(list, (route) => {
    const request = route.request()
    sent.push({ url: request.url(), method: request.method(), body: request.postData() })
    return route.fulfill({ status: 200, contentType: "text/html", body: "<p>Thanks!</p>" })
  })
  await page.goto(note)
  const box = page.locator(".subscribe-box")
  const address = box.getByRole("textbox", { name: "Email address" })

  await box.getByRole("button", { name: "Subscribe" }).click()
  expect(await address.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true)
  expect(sent).toEqual([])

  await address.fill("reader@example.com")
  await box.getByRole("button", { name: "Subscribe" }).click()
  await expect.poll(() => sent.length).toBe(1)
  expect(sent[0]!.url).toBe(list)
  expect(sent[0]!.method).toBe("POST")
  expect(new URLSearchParams(sent[0]!.body ?? "").get("email")).toBe("reader@example.com")
})

test("a reader with only a keyboard can tab to the address, type it, and subscribe", async ({ page }) => {
  const sent: string[] = []
  await page.route(list, (route) => {
    sent.push(route.request().postData() ?? "")
    return route.fulfill({ status: 200, contentType: "text/html", body: "<p>Thanks!</p>" })
  })
  await page.goto(note)
  const box = page.locator(".subscribe-box")
  const address = box.getByRole("textbox", { name: "Email address" })

  // From the top of the page, tab by tab, as far as the address.
  for (let tabs = 0; tabs < 50 && !(await address.evaluate((input) => input === document.activeElement)); tabs++) {
    await page.keyboard.press("Tab")
  }
  await expect(address).toBeFocused()
  await page.keyboard.type("reader@example.com")
  await page.keyboard.press("Tab")
  await expect(box.getByRole("button", { name: "Subscribe" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect.poll(() => sent.length).toBe(1)
  expect(new URLSearchParams(sent[0]).get("email")).toBe("reader@example.com")
})
