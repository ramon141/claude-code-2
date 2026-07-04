export type LayoutType = 'single' | 'side-by-side' | 'top-bottom' | 'three' | 'four'

export const LAYOUT_PANEL_COUNT: Record<LayoutType, number> = {
  single: 1,
  'side-by-side': 2,
  'top-bottom': 2,
  three: 3,
  four: 4,
}

export const LAYOUT_GRID_CLASS: Record<LayoutType, string> = {
  single: 'grid-cols-1',
  'side-by-side': 'grid-cols-2',
  'top-bottom': 'grid-cols-1 grid-rows-2',
  three: 'grid-cols-2 grid-rows-2',
  four: 'grid-cols-2 grid-rows-2',
}

export function defaultLayoutForCount(count: number): LayoutType {
  if (count === 2) return 'side-by-side'
  if (count === 3) return 'three'
  if (count === 4) return 'four'
  return 'single'
}

export function adjustPanelsForLayout<T>(panels: T[], layout: LayoutType, fill: T): T[] {
  const count = LAYOUT_PANEL_COUNT[layout]
  if (panels.length === count) return panels
  if (panels.length > count) return panels.slice(0, count)
  return [...panels, ...Array.from<T>({ length: count - panels.length }).fill(fill)]
}
