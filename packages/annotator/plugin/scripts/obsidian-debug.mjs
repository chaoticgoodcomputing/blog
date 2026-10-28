// Restarts Obsidian with remote debugging on, so scripts/obsidian-logs.mjs can attach to it: quits
// it if it is running, then opens it with `--remote-debugging-port`. The port is on 127.0.0.1 only;
// anything on this machine can drive Obsidian through it until Obsidian is restarted without it.
// macOS only, for now.
//
//   node scripts/obsidian-debug.mjs [--port=9222]

import { execFileSync, spawnSync } from "node:child_process"
import { parseArgs } from "node:util"

const { values } = parseArgs({ options: { port: { type: "string", default: "9222" } } })

if (process.platform !== "darwin") {
  console.error("Only macOS for now: start Obsidian yourself with --remote-debugging-port=" + values.port)
  process.exit(1)
}

const running = () => spawnSync("pgrep", ["-x", "Obsidian"]).status === 0
if (running()) {
  console.log("Quitting Obsidian…")
  execFileSync("osascript", ["-e", 'quit app "Obsidian"'])
  for (let waited = 0; running() && waited < 15_000; waited += 250) await new Promise((resolve) => setTimeout(resolve, 250))
  if (running()) {
    console.error("Obsidian didn't quit; quit it yourself and run this again.")
    process.exit(1)
  }
}

execFileSync("open", ["-a", "Obsidian", "--args", `--remote-debugging-port=${values.port}`, "--remote-debugging-address=127.0.0.1"])
for (let waited = 0; waited < 30_000; waited += 500) {
  try {
    const response = await fetch(`http://127.0.0.1:${values.port}/json/version`)
    if (response.ok) {
      console.log(`Obsidian is running with remote debugging on 127.0.0.1:${values.port}. Logs: pnpm nx run annotator:logs`)
      process.exit(0)
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 500))
}
console.error(`Obsidian started, but nothing answers on port ${values.port}.`)
process.exit(1)
