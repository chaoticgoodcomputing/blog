/**
 * Configuration adapter for normalizing graph configuration options.
 * Handles backward compatibility and provides defaults for all config values.
 */

import type { PseudoShellConfig } from "../../../Graph"

export type LinkDistanceConfig = {
  tagTag: number
  tagPost: number
  postPost: number
}

export type LinkStrengthConfig = {
  tagTag: number
  tagPost: number
  postPost: number
}

export type EdgeOpacityConfig = {
  tagTag: { min: number; max: number }
  tagPost: { min: number; max: number }
  postPost: { min: number; max: number }
}

export type BaseSizeConfig = {
  tags: number
  posts: number
}

export type SizeScalingConfig = {
  tags: number
  posts: number
}

export type LabelAnchorConfig = {
  baseY: number
  scaleFactor: number
}

export type NormalizedPseudoShellConfig = {
  radiusBase: number
  radiusScale: number
  pinnedTags: string[]
  showShell: boolean
  circumferentialRepulsion: number
  shellStyle: {
    color: string
    opacity: number
    lineStyle: "solid" | "dotted"
    lineWidth: number
  }
}


export function normalizeLinkDistance(
  linkDistance: number | { tagTag?: number; tagPost?: number; postPost?: number } | undefined,
): LinkDistanceConfig {
  if (typeof linkDistance === "number") {
    return { tagTag: linkDistance, tagPost: linkDistance, postPost: linkDistance }
  }
  return {
    tagTag: linkDistance?.tagTag ?? 30,
    tagPost: linkDistance?.tagPost ?? 30,
    postPost: linkDistance?.postPost ?? 30,
  }
}

export function normalizeLinkStrength(
  linkStrength: { tagTag?: number; tagPost?: number; postPost?: number } | undefined,
): LinkStrengthConfig {
  return {
    tagTag: linkStrength?.tagTag ?? 2.0,
    tagPost: linkStrength?.tagPost ?? 1.0,
    postPost: linkStrength?.postPost ?? 1.0,
  }
}

export function normalizeEdgeOpacity(
  edgeOpacity:
    | { min?: number; max?: number }
    | {
        tagTag?: { min?: number; max?: number }
        tagPost?: { min?: number; max?: number }
        postPost?: { min?: number; max?: number }
      }
    | undefined,
): EdgeOpacityConfig {
  if (!edgeOpacity) {
    return {
      tagTag: { min: 0.3, max: 1.0 },
      tagPost: { min: 0.2, max: 1.0 },
      postPost: { min: 0.1, max: 0.8 },
    }
  }

  if ("tagTag" in edgeOpacity || "tagPost" in edgeOpacity || "postPost" in edgeOpacity) {
    const perTypeConfig = edgeOpacity as {
      tagTag?: { min?: number; max?: number }
      tagPost?: { min?: number; max?: number }
      postPost?: { min?: number; max?: number }
    }
    return {
      tagTag: { min: perTypeConfig.tagTag?.min ?? 0.3, max: perTypeConfig.tagTag?.max ?? 1.0 },
      tagPost: { min: perTypeConfig.tagPost?.min ?? 0.2, max: perTypeConfig.tagPost?.max ?? 1.0 },
      postPost: {
        min: perTypeConfig.postPost?.min ?? 0.1,
        max: perTypeConfig.postPost?.max ?? 0.8,
      },
    }
  }

  const legacyConfig = edgeOpacity as { min?: number; max?: number }
  const legacyMin = legacyConfig.min ?? 0.2
  const legacyMax = legacyConfig.max ?? 1.0
  return {
    tagTag: { min: legacyMin, max: legacyMax },
    tagPost: { min: legacyMin, max: legacyMax },
    postPost: { min: legacyMin, max: legacyMax },
  }
}

export function normalizeBaseSize(
  baseSize: number | { tags?: number; posts?: number } | undefined,
): BaseSizeConfig {
  if (typeof baseSize === "number") {
    return { tags: baseSize, posts: baseSize }
  }
  return {
    tags: baseSize?.tags ?? 4,
    posts: baseSize?.posts ?? 2,
  }
}

export function normalizeSizeScaling(
  sizeScaling: number | { tags?: number; posts?: number } | undefined,
): SizeScalingConfig {
  if (typeof sizeScaling === "number") {
    return { tags: sizeScaling, posts: sizeScaling }
  }
  return {
    tags: sizeScaling?.tags ?? 2,
    posts: sizeScaling?.posts ?? 1,
  }
}

export function normalizeLabelAnchor(
  labelAnchor: { baseY?: number; scaleFactor?: number } | undefined,
): LabelAnchorConfig {
  return {
    baseY: labelAnchor?.baseY ?? 1.2,
    scaleFactor: labelAnchor?.scaleFactor ?? 0.05,
  }
}

export function normalizeTagColorGradient(
  tagColorGradient: string[] | undefined,
): string[] {
  return tagColorGradient ?? ["#4CAF50", "#2196F3", "#9C27B0", "#FF9800"]
}

export function normalizePseudoShellConfig(
  pseudoShellConfig: PseudoShellConfig | undefined,
  computedStyleMap: Record<string, string>,
): NormalizedPseudoShellConfig {
  const defaultColor = computedStyleMap["--lightgray"] ?? "#e0e0e0"
  
  return {
    radiusBase: pseudoShellConfig?.radiusBase ?? 200,
    radiusScale: pseudoShellConfig?.radiusScale ?? 1.5,
    pinnedTags: pseudoShellConfig?.pinnedTags ?? [],
    showShell: pseudoShellConfig?.showShell ?? true,
    circumferentialRepulsion: pseudoShellConfig?.circumferentialRepulsion ?? 0.5,
    shellStyle: {
      color: pseudoShellConfig?.shellStyle?.color ?? defaultColor,
      opacity: pseudoShellConfig?.shellStyle?.opacity ?? 0.3,
      lineStyle: pseudoShellConfig?.shellStyle?.lineStyle ?? "dotted",
      lineWidth: pseudoShellConfig?.shellStyle?.lineWidth ?? 2,
    },
  }
}
