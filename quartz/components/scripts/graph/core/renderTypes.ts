import { LinkData, NodeData } from "./types"

export type GraphicsInfo = {
  color: string
  alpha: number
  active: boolean
}

export type LinkRenderData = GraphicsInfo & {
  simulationData: LinkData
  lineStyle?: 'solid' | 'dotted'
}

export type LabelData = {
  text: string
  x: number
  y: number
  alpha: number
  scale: number
  fontSize: number
  color: string
  fontFamily: string
  anchor: { x: number; y: number }
  initialAlpha: number
}

export type NodeRenderData = GraphicsInfo & {
  simulationData: NodeData
  label: LabelData
  radius: number
  fillColor: string
  strokeColor?: string
  strokeWidth?: number
  iconImage?: HTMLImageElement | null
  iconSize?: number
}

export type TweenNode = {
  update: (time: number) => void
  stop: () => void
}
