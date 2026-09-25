// Stands in for @quartz-themes/core's cascade position, and nothing else: its first stylesheet's
// layer statement, which is what ranks a theme's layers on a page. No rules, so it styles nothing.
export default function FixtureTheme() {
  return {
    name: "FixtureTheme",
    // The loader skips a transformer with no hook.
    textTransform: (_ctx, src) => src,
    externalResources: () => ({
      css: [{ content: "@layer quartz-base, obsidian-theme, quartz-themes-base, obsidian-theme-overrides;", inline: true }],
    }),
  }
}
