// The plugin's one component, which Quartz's loader imports from `./components` by the name in
// package.json's `quartz.components`. With exactly one, the loader also finds it by the plugin's own
// name, so a plain `source:` entry places it (docs/adr/0001).
export { default as SocialMedia } from "./SocialMedia"
export type { SocialMediaOptions } from "../options"
