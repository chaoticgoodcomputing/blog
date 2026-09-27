// Knobs for running more than one copy of the suite at once, e.g. one per git worktree. Every
// copy serves its two fixture sites on a pair of ports, so each needs its own base port.
//   CGC_E2E_PORT     the fixture site's port; the baseline takes the next one (default 4173)
//   CGC_E2E_WORKERS  Playwright workers (default: Playwright's own, half the CPUs)
export const PORT = Number(process.env.CGC_E2E_PORT ?? 4173)
export const BASELINE_PORT = PORT + 1
export const WORKERS = process.env.CGC_E2E_WORKERS ? Number(process.env.CGC_E2E_WORKERS) : undefined

// ADR-0004 rule 7: every fixture spec renders under both colour schemes. Each scheme is a
// Playwright project per test directory, emulating the OS preference, which the stock darkmode
// plugin follows on first load.
export const SCHEMES = ["light", "dark"]
