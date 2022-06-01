import { v4 } from 'uuid';
import { LO } from '../../util/ListenableObject';
import { DCMCube, DCMModel } from './../model/DcmModel';
import DcProject from "./DcProject";

type BBModelFormat = {
  meta: MetaData,
  name: string;
  geometry_name: "Model";
  visible_box: [1, 1, 0];
  variable_placeholders: string;
  variable_placeholder_buttons: never[];
  timeline_setups: never[];
  resolution: { width: number, height: number }
  elements: CubeElement[]
  outliner: BoneElement[]
  textures: TextureElement[]
  animations: AnimationElement[]
}

type MetaData = {
  format_version: "4.0";
  creation_time: number;
  model_format: "bedrock";
  box_uv: true;
}

type CubeElement = {
  name: string
  type: "cube"
  rescale: boolean
  locked: boolean
  from: readonly [number, number, number]
  to: readonly [number, number, number]
  autouv: number
  color: number
  origin: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  uv_offset?: readonly [number, number]
  faces: {
    north: CubeElementFace
    east: CubeElementFace
    south: CubeElementFace
    west: CubeElementFace
    up: CubeElementFace
    down: CubeElementFace
  }
  uuid: string
}

type CubeElementFace = {
  uv: [number, number, number, number],
  texture: number
}

type BoneElement = {
  name: string,
  origin: readonly [number, number, number],
  rotation?: readonly [number, number, number],
  bedrock_binding: "",
  color: 0,
  uuid: string,
  export: true,
  isOpen: true,
  locked: false,
  visibility: true,
  autouv: 0,
  children: (string | BoneElement)[]
}

type TextureElement = {
  path: string,
  name: string,
  folder: string,
  namespace: string,
  id: string,
  particle: boolean,
  render_mode: "default",
  visible: true,
  mode: "bitmap",
  saved: false,
  uuid: string,
  source: string
}


type AnimationElement = {
  uuid: string,
  name: string,
  loop: "loop",
  override: false,
  length: number,
  snapping: 24,
  selected: false,
  saved: false,
  path: "",
  anim_time_update: "",
  blend_weight: "",
  start_delay: "",
  loop_delay: "",
  animators: {
    [s: string]: {
      name: "bone",
      type: "bone",
      keyframes: KeyframeElement[]
    }
  }
}

type KeyframeElement = {
  channel: "position" | "rotation" | "scale",
  data_points: { x: number, y: number, z: number }[],
  uuid: string,
  time: number,
  color: -1,
  interpolation: "linear"
}

type LookupMap = Map<DCMCube, { cube: CubeElement, bone: BoneElement }>
type WorldPositionCache = Map<DCMCube, readonly [number, number, number]>

export const exportAsBBModel = async (project: DcProject): Promise<Blob> => {
  const lookupMap: LookupMap = new Map()
  const positionCache: WorldPositionCache = new Map()
  const { cubes, bones } = convertAllCubes(project.model, lookupMap, positionCache)

  const model: BBModelFormat = {
    ...createBasicModelData(),
    name: project.name.value,
    resolution: {
      width: project.model.textureWidth.value,
      height: project.model.textureHeight.value
    },
    elements: cubes,
    outliner: bones,
    textures: [],
    animations: []
  }
  return new Blob([JSON.stringify(model)])
}

const createBasicModelData = (): Pick<BBModelFormat,
  "meta" | "geometry_name" | "visible_box" | "variable_placeholders" |
  "variable_placeholder_buttons" | "timeline_setups"
> => ({
  meta: {
    format_version: '4.0',
    creation_time: Math.floor(Date.now() / 1000),
    box_uv: true,
    model_format: "bedrock",
  } as const,
  geometry_name: "Model",
  visible_box: [1, 1, 0],
  variable_placeholders: "",
  variable_placeholder_buttons: [],
  timeline_setups: [],
})


const convertAllCubes = (model: DCMModel, lookupMap: LookupMap, positionCache: WorldPositionCache) => {
  const cubes: CubeElement[] = []
  const bones: BoneElement[] = []

  model.resetVisuals()

  model.children.value.forEach(cube => convertCubeAndBone(cube, cubes, b => bones.push(b), lookupMap, positionCache))
  return { cubes, bones }
}

const convertCubeAndBone = (dcmCube: DCMCube, cubes: CubeElement[], boneAcceptor: (bone: BoneElement) => void, lookup: LookupMap, positionCache: WorldPositionCache) => {
  const bone = convertBoneWithoutChildren(dcmCube, positionCache)
  const cube = convertCube(dcmCube, positionCache)
  bone.children.push(cube.uuid)

  cubes.push(cube)
  boneAcceptor(bone)

  lookup.set(dcmCube, { cube, bone })

  dcmCube.children.value.forEach(cube => convertCubeAndBone(cube, cubes, b => bone.children.push(b), lookup, positionCache))
}

const convertCube = (cube: DCMCube, positionCache: WorldPositionCache): CubeElement => {
  const position = getCubePosition(cube, positionCache)
  const offset = _cloneArr(cube.offset)
  const dimension = _cloneArr(cube.dimension)

  const from = plusArr(position, offset)
  return {
    name: `${cube.name.value}_cube`,
    rescale: false,
    locked: false,
    from: from,
    to: plusArr(from, dimension),
    autouv: 0,
    color: 1,
    origin: [0, 0, 0],
    uv_offset: _cloneArr(cube.textureOffset),
    faces: {
      north: getCubeFace(cube, 0),
      east: getCubeFace(cube, 0),
      south: getCubeFace(cube, 0),
      west: getCubeFace(cube, 0),
      up: getCubeFace(cube, 0),
      down: getCubeFace(cube, 0),
    },
    type: "cube",
    uuid: v4()
  }
}

const convertBoneWithoutChildren = (cube: DCMCube, positionCache: WorldPositionCache): BoneElement => {
  return {
    name: cube.name.value,
    origin: getCubePosition(cube, positionCache),
    rotation: _cloneArr(cube.rotation),
    bedrock_binding: "",
    color: 0,
    uuid: v4(),
    export: true,
    isOpen: true,
    locked: false,
    visibility: true,
    autouv: 0,
    children: []
  }
}

const getCubePosition = (cube: DCMCube, positionCache: WorldPositionCache): readonly [number, number, number] => {
  const cache = positionCache.get(cube)
  if (cache !== undefined) {
    return cache
  }

  //I'm not at all sure how this function works. I believe *thought* I knew how blockbench 
  //handles it's models, but apparently not.
  //My old documentation for it is as follows:
  //
  //for tail1 (child of hips):
  //  We need to return the position x', such that rotating x' around the parents pivot point by the 
  //  parents local rotation yields x 
  //Note that the parents pivot point is the world position of the parent
  //
  //We want a new position x, such that the parent's rotation p moves x' into x
  //Get the local position
  // p---\
  //      \---\
  //           \--x
  //
  // roate by the inverse parent local rotation
  // p--------------x'
  // Use that as the new position, as it will be rotated automatically
  //This then needs to be used as an offset of the parent?

  //However, this is not even true, and the below works for some reason
  const position = cube.position.value
  const parent = cube.parent
  if (!(parent instanceof DCMCube)) {
    return position
  }

  const parentPosition = getCubePosition(parent, positionCache)

  return [
    position[0] + parentPosition[0],
    position[1] + parentPosition[1],
    position[2] + parentPosition[2],
  ] as const
}

const getCubeFace = (cube: DCMCube, face: number): CubeElementFace => ({
  texture: 0,
  uv: [0, 0, 1, 1]
})

const plusArr = (arr1: readonly [number, number, number], arr2: readonly [number, number, number]): readonly [number, number, number] => {
  return [
    arr1[0] + arr2[0],
    arr1[1] + arr2[1],
    arr1[2] + arr2[2],
  ]
}

const _cloneArr = <T>(lo: LO<T>): T => {
  return Array.from(lo.value as any) as any
}