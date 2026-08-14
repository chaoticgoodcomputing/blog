import type { WidgetRegistry } from "../../../quartz/widgets/types"
import { initialization } from "./initialization"
import { pageAssets } from "./page-assets"
import { gameOfLife } from "./game-of-life"
import { probabilityConvolutions } from "./probability-convolutions"
import { randomWalk } from "./random-walk"

/**
 * Vault-specific widget registry.
 * 
 * To add a new vault widget:
 * 1. Create the widget in content/public/widgets/{name}/
 * 2. Import and register it here
 * 3. Use it in MDX files: import { Widget } from '@content/widgets/{name}'
 */
export const contentWidgets: WidgetRegistry = {
  "@content/widgets/initialization": initialization,
  "@content/widgets/page-assets": pageAssets,
  "@content/widgets/game-of-life": gameOfLife,
  "@content/widgets/probability-convolutions": probabilityConvolutions,
  "@content/widgets/random-walk": randomWalk,
}

/**
 * Get a vault widget definition by import path.
 */
export function getContentWidget(importPath: string) {
  return contentWidgets[importPath]
}

/**
 * Get all registered vault widget import paths.
 */
export function getAllContentWidgetPaths(): string[] {
  return Object.keys(contentWidgets)
}
