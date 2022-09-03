import { Object3D } from "three"

const validTypes = ["cube", "refimg", "pointtracker"] as const
const typeKey = "dumbcode_intersect_type"
const intersectThrough = "dumbcode_intersect_through"
const visibleKey = "dumbcode_visible_key"

export const setIntersectType = (object: Object3D, type: typeof validTypes[number], enabled?: () => boolean) => {
  object.userData[typeKey] = type
  if (enabled) {
    object.userData[visibleKey] = enabled
  }
}

export const setIntersectThrough = (object: Object3D, through: boolean) => {
  object.userData[intersectThrough] = through
}

export const hasIntersectTypeAndIsVisible = (object: Object3D) => {
  const vis = object.userData[visibleKey]
  return object.userData[typeKey] !== undefined && (vis === undefined || vis())
}

export const getIntersectType = (object: Object3D): typeof validTypes[number] | undefined => {
  return object.userData[typeKey]
}

export const getIntersectThrough = (object: Object3D): boolean | undefined => {
  return object.userData[intersectThrough]
}

export type PartialObject3DMap = Partial<Record<typeof validTypes[number], Object3D>>
