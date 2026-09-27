// The timer d3-force gets in this plugin's bundle (build.mjs), in place of d3-timer's. d3-force runs a
// simulation on its own timer, which runs its own animation frames and holds a page-wide interval for
// as long as the layout moves. The graph already draws every frame, so it ticks its simulation there
// (draw.ts), and the simulation's own timer never runs.
export function timer() {
  return { restart() {}, stop() {} }
}
