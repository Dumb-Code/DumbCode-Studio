/**
 * Face indices 0-5 match {@link TextureManager.getCubeFacePixelRects} / Three.js box material order:
 * 0 +X, 1 −X, 2 +Y, 3 −Y, 4 +Z, 5 −Z (Minecraft-style: east, west, up, down, south, north).
 */

export const normalizePaintFaceAliasKey = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\./g, "_")
    .replace(/[\s/\\]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")

/** Single source of truth: index + every accepted string token (before normalization). */
export const PAINT_FACE_DEFINITIONS: readonly {
  readonly index: 0 | 1 | 2 | 3 | 4 | 5
  readonly threeAxis: string
  readonly minecraft: string
  readonly aliases: readonly string[]
}[] = [
  {
    index: 0,
    threeAxis: "+X",
    minecraft: "east",
    aliases: [
      "0",
      "+x",
      "x+",
      "x_plus",
      "plus_x",
      "positive_x",
      "pos_x",
      "px",
      "east",
      "east_face",
      "e",
      "right",
      "rhs",
      "uv_east",
      "uv_px",
      "uv_right",
      "uv_pos_x",
      "side_east",
      "face_east",
      "cube_face_east",
      "f0",
      "face0",
      "face_0",
      "xmax",
      "max_x",
      "maxx",
      "xp",
    ],
  },
  {
    index: 1,
    threeAxis: "-X",
    minecraft: "west",
    aliases: [
      "1",
      "-x",
      "x-",
      "x_minus",
      "minus_x",
      "negative_x",
      "neg_x",
      "nx",
      "west",
      "west_face",
      "w",
      "left",
      "lhs",
      "uv_west",
      "uv_nx",
      "uv_left",
      "uv_neg_x",
      "side_west",
      "face_west",
      "cube_face_west",
      "f1",
      "face1",
      "face_1",
      "xmin",
      "min_x",
      "minx",
      "xm",
    ],
  },
  {
    index: 2,
    threeAxis: "+Y",
    minecraft: "up",
    aliases: [
      "2",
      "+y",
      "y+",
      "y_plus",
      "plus_y",
      "positive_y",
      "pos_y",
      "py",
      "up",
      "top",
      "u",
      "uv_up",
      "uv_py",
      "uv_top",
      "uv_pos_y",
      "side_up",
      "face_up",
      "cube_face_up",
      "ceiling",
      "upper",
      "ymax",
      "max_y",
      "maxy",
      "yp",
      "f2",
      "face2",
      "face_2",
    ],
  },
  {
    index: 3,
    threeAxis: "-Y",
    minecraft: "down",
    aliases: [
      "3",
      "-y",
      "y-",
      "y_minus",
      "minus_y",
      "negative_y",
      "neg_y",
      "ny",
      "down",
      "bottom",
      "d",
      "floor",
      "uv_down",
      "uv_ny",
      "uv_bottom",
      "uv_neg_y",
      "side_down",
      "face_down",
      "cube_face_down",
      "f3",
      "face3",
      "face_3",
      "lower",
      "ymin",
      "min_y",
      "miny",
      "ym",
    ],
  },
  {
    index: 4,
    threeAxis: "+Z",
    minecraft: "south",
    aliases: [
      "4",
      "+z",
      "z+",
      "z_plus",
      "plus_z",
      "positive_z",
      "pos_z",
      "pz",
      "south",
      "south_face",
      "s",
      "front",
      "forward",
      "fwd",
      "uv_south",
      "uv_pz",
      "uv_front",
      "uv_forward",
      "uv_pos_z",
      "side_south",
      "face_south",
      "cube_face_south",
      "f4",
      "face4",
      "face_4",
      "zmax",
      "max_z",
      "maxz",
      "zp",
      "fore",
    ],
  },
  {
    index: 5,
    threeAxis: "-Z",
    minecraft: "north",
    aliases: [
      "5",
      "-z",
      "z-",
      "z_minus",
      "minus_z",
      "negative_z",
      "neg_z",
      "nz",
      "north",
      "north_face",
      "n",
      "back",
      "backward",
      "rear",
      "uv_north",
      "uv_nz",
      "uv_back",
      "uv_rear",
      "uv_neg_z",
      "side_north",
      "face_north",
      "cube_face_north",
      "f5",
      "face5",
      "face_5",
      "zmin",
      "min_z",
      "minz",
      "zm",
      "aft",
    ],
  },
] as const

export const PAINT_FACE_ALIAS_TO_INDEX: ReadonlyMap<string, number> = (() => {
  const map = new Map<string, number>()
  for (const def of PAINT_FACE_DEFINITIONS) {
    for (const name of def.aliases) {
      map.set(normalizePaintFaceAliasKey(name), def.index)
    }
  }
  return map
})()

export const resolvePaintFaceToken = (token: unknown, positionLabel: string): number => {
  if (typeof token === "number") {
    if (!Number.isInteger(token) || token < 0 || token > 5) {
      throw new Error(`${positionLabel} must be an integer face index from 0 to 5`)
    }
    return token
  }
  if (typeof token === "string") {
    const key = normalizePaintFaceAliasKey(token)
    if (/^[0-5]$/.test(key)) {
      return Number(key)
    }
    const idx = PAINT_FACE_ALIAS_TO_INDEX.get(key)
    if (idx !== undefined) {
      return idx
    }
    throw new Error(
      `${positionLabel}: unknown face "${token}". Use 0-5 or an alias (east/west/up/down/south/north, px/nx/py/ny/pz/nz, uv_east, front/back, ...). See paintFaceAliases.ts.`,
    )
  }
  throw new Error(`${positionLabel} must be a face index (0-5) or a string alias`)
}

/** Compact line for MCP_ACTION_SCHEMA. */
export const PAINT_FACE_ALIASES_SCHEMA_HINT =
  "all | one face string | array; indices 0-5 = +X,-X,+Y,-Y,+Z,-Z (east,west,up,down,south,north). Many aliases: px/nx/py/ny/pz/nz, right/left/top/bottom/front/back, uv_east...uv_north, face0...face5, pos_x, forward, ... - full list in paintFaceAliases.PAINT_FACE_DEFINITIONS"
