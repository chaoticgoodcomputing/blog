// The upgrade's `--verify` (#100): after a successful upgrade, run the repo guards, the typechecks,
// the e2e suite, the real-site build and the acceptance report, in that order, stopping at the
// first that fails. Tested at the command line against the synthetic fixture, with stand-in steps
// (QUARTZ_VERIFY_STEPS) that log their names, so the real suite never runs from here.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { makeFixture } from "./fixtures/quartz-repo.mjs"
import { VERIFY_STEPS } from "../upgrade.mjs"

const MANIFEST = "quartz-v5/upstream.json"

// Stand-ins for --verify's steps: each appends its name (and its arguments) to a log and exits
// with the given code.
function standIns(fx, codes) {
  const log = path.join(fx.dir, "verify.log")
  const steps = codes.map((code, i) => ({
    name: `step ${i + 1}`,
    command: [
      "node",
      "-e",
      `require("fs").appendFileSync(${JSON.stringify(log)}, process.argv.slice(1).join(" ") + "\\n"); process.exit(${code})`,
      `step-${i + 1}`,
      ...(i === codes.length - 1 ? ["--v4", "{v4}"] : []),
    ],
  }))
  const file = path.join(fx.dir, "verify-steps.json")
  fs.writeFileSync(file, JSON.stringify(steps))
  const ran = () => (fs.existsSync(log) ? fs.readFileSync(log, "utf-8").trim().split("\n") : [])
  return { env: { QUARTZ_VERIFY_STEPS: file }, ran }
}

test("--verify's steps are the repo guards, the typechecks, the e2e suite, the real-site build and the acceptance report, in that order", () => {
  assert.deepEqual(
    VERIFY_STEPS.map(({ name }) => name),
    [
      "the repo guards",
      "the typechecks",
      "the e2e suite",
      "the real-site build",
      "the acceptance report",
    ],
  )
  assert.ok(
    VERIFY_STEPS.at(-1).command.includes("{v4}"),
    "the acceptance report takes the v4 build as an input",
  )
})

describe("--verify, when every step passes", () => {
  let fx, res, ran, v4
  before(() => {
    fx = makeFixture()
    v4 = path.join(fx.dir, "v4-public")
    fs.mkdirSync(v4)
    const stand = standIns(fx, [0, 0, 0, 0, 0])
    res = fx.upgrade([`--ref=${fx.target}`, "--verify", `--v4=${v4}`], stand.env)
    ran = stand.ran()
  })
  after(() => fx.cleanup())

  test("runs every step, in order, after the upgrade, and exits 0", () => {
    assert.equal(res.code, 0, res.output)
    assert.deepEqual(ran, ["step-1", "step-2", "step-3", "step-4", `step-5 --v4 ${v4}`])
    assert.ok(
      res.output.indexOf("▸ record the pinned ref") < res.output.indexOf("▸ verify"),
      res.output,
    )
    assert.match(res.output, /all 5 check\(s\) passed/)
  })
})

describe("--verify, when a step fails", () => {
  let fx, res, ran
  before(() => {
    fx = makeFixture()
    fs.mkdirSync(path.join(fx.root, "dist/public"), { recursive: true })
    const stand = standIns(fx, [0, 3, 0, 0, 0])
    res = fx.upgrade([`--ref=${fx.target}`, "--verify"], stand.env)
    ran = stand.ran()
  })
  after(() => fx.cleanup())

  test("stops at the first failure, naming it, and exits non-zero", () => {
    assert.notEqual(res.code, 0)
    assert.deepEqual(ran, ["step-1", "step-2"])
    assert.match(res.output, /--verify failed at step 2/)
    assert.match(res.output, /not safe to commit/)
  })

  test("says truthfully that the upgrade was recorded", () => {
    assert.equal(JSON.parse(fx.read(MANIFEST)).commit, fx.target)
    assert.match(res.output, /upstream\.json records the target/)
    assert.doesNotMatch(res.output, /upstream\.json is unchanged/)
  })
})

describe("--verify without a v4 build to compare against", () => {
  let fx, res, ran
  before(() => {
    fx = makeFixture()
    const stand = standIns(fx, [0, 0, 0, 0, 0])
    res = fx.upgrade([`--ref=${fx.target}`, "--verify", "--v4=no/such/dir"], stand.env)
    ran = stand.ran()
  })
  after(() => fx.cleanup())

  test("refuses before the upgrade starts, and changes nothing", () => {
    assert.equal(res.code, 1)
    assert.match(res.output, /compares against a built v4 site/)
    assert.deepEqual(ran, [])
    assert.equal(fx.status(), "")
    assert.equal(JSON.parse(fx.read(MANIFEST)).commit, fx.pinned)
  })
})
