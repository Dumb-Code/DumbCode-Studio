import { DCMCube } from './DcmModel';
//TODO: explain why this is (8/16, 12/16, 0)
//As the x and y axis are flipped, and the tbl origins are differnet to the studio origins,
//we need to flip around a point inbetween the x axis and the y axis 
// x: 8/16 (not sure -- investigate)

import JSZip from "jszip";
import { Matrix4, Matrix4Tuple, Quaternion, Vector3, Vector3Tuple } from "three";
import CubeLocker from '../../util/CubeLocker';
import { NumArray } from '../../util/NumArray';
import { DCMModel } from "./DcmModel";

// y: 12/16 as the tbl origin is at 24/16
export let worldPos = new Vector3(8 / 16, 12 / 16, 0)
export let worldX = new Vector3(1, 0, 0)
export let worldY = new Vector3(0, 1, 0)

/**
 * Reads and converts a .tbl model to a DCMModel
 * @param {ArrayBuffer} data the arraybuffer containging the data
 * @returns {DCMModel} a converted model
 */
export async function readTblFile(data: ArrayBuffer): Promise<[DCMModel, string, number]> {
  let model = new DCMModel()

  model.undoRedoHandler.ignoreActions = true

  let zip = await JSZip.loadAsync(data)
  const file = zip.file("model.json")
  if (file === null) {
    throw new Error("No model.json file found in .tbl file")
  }
  let json = JSON.parse(await file.async("string"))

  if (json.projVersion == 4) {
    parseV4Tbl(model, json)
  } else if (json.projVersion >= 5) {
    parseV5Tbl(model, json)
  } else {
    console.error("Don't know how to convert tbl with version " + json.projVersion)
  }

  //We need to run the mirroring and invert math, to do that we need three.js stuff, 
  //and for that we need to pass a dummy material.
  model.modelGroup.updateMatrixWorld(true)

  runMirrorMath(worldPos, worldX, null, model)
  runMirrorMath(worldPos, worldY, null, model)
  runInvertMath(model, null)

  model.undoRedoHandler.ignoreActions = false
  return [model, "tbl", json.projVersion]
}

type V4TBLCube = {
  name: string
  dimensions: [number, number, number]
  position: [number, number, number]
  offset: [number, number, number]
  rotation: [number, number, number]
  txOffset: [number, number]
  txMirror: boolean
  mcScale: number
  cubeGrow?: [number, number, number]
  children: V4TBLCube[]
}

type V4TBLCubeGroup = {
  cubes: V4TBLCube[]
  cubeGroups: V4TBLCubeGroup[]
}

type V4TBL = {
  authorName: string
  textureWidth: number
  textureHeight: number
} & V4TBLCubeGroup

function parseV4Tbl(model: DCMModel, json: V4TBL) {
  //Transferable properties
  model.author.value = json.authorName
  model.textureWidth.value = json.textureWidth
  model.textureHeight.value = json.textureHeight

  let readCube = (json: V4TBLCube) => {
    let children: DCMCube[] = []
    json.children.forEach(child => { children.push(readCube(child)) })

    //Allow for .tbl files to have a cubeGrow element. For some reason this is here even tho
    //.tbl never supported this. Keeping it in. (maybe due to the fact we have our own .tbl format)
    let cubeGrow = json.cubeGrow
    if (cubeGrow === undefined) {
      cubeGrow = [json.mcScale, json.mcScale, json.mcScale]
    }

    return new DCMCube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.txOffset, json.txMirror, cubeGrow, children, model)
  }

  //Navigates a group. Groups just get pushed onto as roots.
  //The root json is counted as a group, as it has the same properties that we look at (cubes, cubeGroups)
  let navigateGroup = (group: V4TBLCubeGroup) => {
    model.children.value = model.children.value.concat(group.cubes.map(cube => readCube(cube)))
    group.cubeGroups.forEach(g => navigateGroup(g))
  }
  navigateGroup(json)
}

type V5TBLBox = {
  name: string

  dimX: number
  dimY: number
  dimZ: number

  posX: number
  posY: number
  posZ: number

  expandX: number
  expandY: number
  expandZ: number
}

type V5TBLPart = {
  name: string

  boxes: V5TBLBox[]
  children: V5TBLPart[]

  rotPX: number
  rotPY: number
  rotPZ: number

  rotAX: number
  rotAY: number
  rotAZ: number

  texOffX: number
  texOffY: number

  mirror: boolean
}

type V5TBL = {
  author: string
  texWidth: number
  texHeight: number
  parts: V5TBLPart[]
}

function parseV5Tbl(model: DCMModel, json: V5TBL) {
  //Transferable properties
  model.author.value = json.author
  model.textureWidth.value = json.texWidth
  model.textureHeight.value = json.texHeight

  let readPartToCubes = (json: V5TBLPart) => {
    let name = json.boxes.length === 1 ? json.name : undefined
    let cubes = json.boxes.map(b => readCube(json, b, name))
    if (cubes.length === 0) {
      console.warn("TODO: move point with matrix when no box route")
      return []
    }
    cubes[0].children.value = json.children.flatMap(readPartToCubes)
    return cubes
  }
  let readCube = (part: V5TBLPart, json: V5TBLBox, name = part.name) => {
    return new DCMCube(
      name,
      [json.dimX, json.dimY, json.dimZ],
      [part.rotPX, part.rotPY, part.rotPZ],
      [json.posX, json.posY, json.posZ],
      [part.rotAX, part.rotAY, part.rotAZ],
      [part.texOffX, part.texOffY],
      part.mirror,
      [json.expandX, json.expandY, json.expandZ],
      [],
      model
    )
  }
  model.children.value = json.parts.flatMap(readPartToCubes)
}

const tempMirrorVec = new Vector3()
const tempCubePos = new Vector3()
const tempCubeQuat = new Quaternion()
const tempCubeAxisBase = new Vector3()
const tempCubeXAxis = new Vector3()
const tempCubeYAxis = new Vector3()
const tempCubeZAxis = new Vector3()
const tempCubeScale = new Vector3()
const tempScaleMatrix = new Matrix4()
const tempPositionMatrix = new Matrix4()
const tempRotationMatrix = new Matrix4()
const tempResultMatrix = new Matrix4()
const tempCubeOldBase = new Vector3()
const tempCubeNewBase0 = new Vector3()
const tempCubeNewBase1 = new Vector3()

function runMirrorMath(worldPos: Vector3, normal: Vector3, cubes: DCMCube[] | null, tbl: DCMModel) {
  tbl.resetVisuals()
  if (cubes == null) {
    cubes = []
    tbl.traverseAll(cube => cubes!.push(cube))
  }

  //Get the total cubes
  let totalCubesToApplyTo: { type: number, cube: DCMCube }[] = []
  cubes.forEach(cube => totalCubesToApplyTo.push({ type: 0, cube }))

  //Wrongfully moved cubes are cubes should shouldn't move but do because of locked cubes.
  let wrongFullyMovedCubes = cubes.map(c => c.children.value).flat().filter(c => !cubes!.includes(c))
  wrongFullyMovedCubes.forEach(cube => totalCubesToApplyTo.push({ type: 1, cube }))

  //Sort the total cubes to apply to.
  totalCubesToApplyTo.sort((a, b) => a.cube.hierarchyLevel - b.cube.hierarchyLevel)

  //Get all the lockets
  let lockets = new Map()
  wrongFullyMovedCubes.forEach(cube => lockets.set(cube, new CubeLocker(cube)))

  //Definition of a plane at point (x0, y0, z0) (var: worldPos) with normal (A, B, C) (var: normal): 
  //A(x − x0) + B(y − y0) + C(z − z0) = 0
  //
  //I want to find the projection point (x,y,z) (var: vec) onto the plane. This would be defined as (x+At, y+Bt, z+Ct), where t is a random variable
  //Putting that back into the plane equation:
  //      A((x+At)-x0) + B((y+Bt)-y0) + C((z+Ct)-z0) = 0
  //  =>  A(x+At-x0) + B(y+Bt-y0) + C(z+Ct-z0) = 0
  //  =>  Ax+AAt-Ax0 + By+BBt-By0 + Cz+CCT-Cz0 = 0
  //  =>  AAt + BBt + CCt = Ax0-Ax + By0-By + Cz0-Cz
  //  =>  t = (Ax0-Ax + By0-By + Cz0-Cz) / (AA+BB+CC) - It's worth noting that AA+BB+CC is the same as `normal.lengthSquared()`
  //
  //Once t is found, I can put it back into (x+At, y+Bt, z+Ct) to give me the projection point on the plane.
  //With the projection point on the plane, I can find the difference between that and the starting point, and move the point by that distance again.
  let mirrorPoint = (vec: Vector3) => {
    let t = (normal.x * (worldPos.x - vec.x) + normal.y * (worldPos.y - vec.y) + normal.z * (worldPos.z - vec.z)) / normal.lengthSq()
    let diff = tempMirrorVec.set(normal.x * t, normal.y * t, normal.z * t).multiplyScalar(2)
    vec.add(diff)
    return vec
  }

  //Start data cache is all the data from the cubes, before the math has been applied.
  let startDataCache = new Map<DCMCube, {
    oldCorner: Vector3Tuple;
    base: Vector3Tuple;
    newMatrix: Matrix4Tuple;
    rotationMatrix: Matrix4Tuple;
    position: NumArray;
    rotation: NumArray;
    offset: NumArray;
  }>()
  cubes.forEach(cube => {

    //Get the mirrored position
    cube.cubeGroup.matrixWorld.decompose(tempCubePos, tempCubeQuat, tempCubeScale)
    let newPosition = mirrorPoint(tempCubePos)

    let oldCorner = mirrorPoint(cube.getWorldPosition(1, 1, 1, tempCubeOldBase))

    //Get the mirrored positions of all 3 axis points, take that away from the cube origin then create a rotation matrix from that.
    //Using that rotation matrix, a translation matrix and a scale matrix, construct a full matrix for the cube. Then use the cube locker
    //To turn that into the cubes position and rotation.
    let base = mirrorPoint(cube.getWorldPosition(0, 0, 0, tempCubeAxisBase))
    let xAxis = mirrorPoint(cube.getWorldPosition(1, 0, 0, tempCubeXAxis)).sub(base).normalize()
    let yAxis = mirrorPoint(cube.getWorldPosition(0, 1, 0, tempCubeYAxis)).sub(base).normalize()
    let zAxis = mirrorPoint(cube.getWorldPosition(0, 0, 1, tempCubeZAxis)).sub(base).normalize()

    //Construct the matricies
    let scaleMatrix = tempScaleMatrix.makeScale(tempCubeScale.x, tempCubeScale.y, tempCubeScale.z)
    let positionMatrix = tempPositionMatrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z)
    let rotationMatrix = tempRotationMatrix.set(
      xAxis.x, yAxis.x, zAxis.x, 0,
      xAxis.y, yAxis.y, zAxis.y, 0,
      xAxis.z, yAxis.z, zAxis.z, 0,
      0, 0, 0, 1
    )

    let newMatrix = tempResultMatrix.copy(scaleMatrix).premultiply(rotationMatrix).premultiply(positionMatrix)

    startDataCache.set(cube, {
      oldCorner: oldCorner.toArray(),
      base: base.toArray(),
      newMatrix: newMatrix.toArray(),
      rotationMatrix: rotationMatrix.toArray(),

      position: cube.position.value,
      rotation: cube.rotation.value,
      offset: cube.offset.value
    })
  })

  //End data cache is the result of the cube properties after the math has been applied.
  let endDataCache = new Map<DCMCube, {
    position: NumArray;
    rotation: NumArray;
    offset: NumArray;
  }>()
  totalCubesToApplyTo.forEach(data => {
    let cube = data.cube
    if (data.type === 1) {
      lockets.get(cube).reconstruct()
    } else if (data.type === 0) {
      let cache = startDataCache.get(cube)
      if (cache === undefined) {
        return
      }

      CubeLocker.reconstructLocker(cube, 0, tempResultMatrix.fromArray(cache.newMatrix))
      cube.cubeGroup.updateMatrixWorld(true)

      //Get opposite corners on the cube (0, 0, 0) -> (1, 1, 1), and get the difference between where the mirrored position is,
      //and where it is currently. The avarage between those two differences will be how much to change the offset by.
      //Transform that into local space, then add it onto the offset. 
      let inverseRotation = tempResultMatrix.fromArray(cache.rotationMatrix).invert()

      //The point at (0, 0, 0)
      let currentPoint0 = cube.getWorldPosition(0, 0, 0, tempCubeNewBase0)
      let toMove0 = currentPoint0.sub(tempCubePos.fromArray(cache.base))

      //The point at (1, 1, 1)
      let currentPoint1 = cube.getWorldPosition(1, 1, 1, tempCubeNewBase1)
      let toMove1 = currentPoint1.sub(tempCubePos.fromArray(cache.oldCorner))

      //Add the points together and rotate them into local space.
      //As we have a offsets in terms of 16 rather than 1, we need to multiply by 16.
      //As this is a sum of the 2 points, we need to find the avarage, so we divide by 2.
      //This can be simplified to multiplying by 8 ( * 16 / 2)
      let toMove = toMove0.add(toMove1).applyMatrix4(inverseRotation).multiplyScalar(8) //8 = 16 /2
      cube.updateOffset([cube.offset.value[0] + toMove.x, cube.offset.value[1] + toMove.y, cube.offset.value[2] + toMove.z])
    }
    endDataCache.set(cube, {
      position: cube.position.value,
      rotation: cube.rotation.value,
      offset: cube.offset.value,
    })
  })

  // //If it's a dummy, we need to reset the visuals and return the command result cache.
  // if (dummy === true) {
  //   let resetVisuals = (visualOnly: boolean) => {
  //     startDataCache.forEach((cache, cube) => {
  //       cube.updatePosition([...cache.rotationPoint], visualOnly)
  //       cube.updateRotation([...cache.rotation], visualOnly)
  //       cube.updateOffset([...cache.offset], visualOnly)
  //     })
  //   }

  //   resetVisuals(false)
  //   return {
  //     onExit: () => {
  //       resetVisuals(true)
  //       tbl.modelCache.updateMatrixWorld(true)
  //       // totalCubesToApplyTo.forEach(d => d.cube.cubeGroup.updateMatrixWorld(true))
  //     },
  //     applyOnFrame: () => {
  //       endDataCache.forEach((cache, cube) => {
  //         cube.updatePosition([...cache.rotationPoint], true)
  //         cube.updateRotation([...cache.rotation], true)
  //         cube.updateOffset([...cache.offset], true)
  //       })
  //       tbl.modelCache.updateMatrixWorld(true)
  //       // totalCubesToApplyTo.forEach(d => d.cube.cubeGroup.updateMatrixWorld(true))
  //     }
  //   }
  // }
}

function runInvertMath(model: DCMModel, rawCubes: DCMCube[] | null) {
  let everySingleCube: DCMCube[] = []
  model.traverseAll(cube => everySingleCube.push(cube))
  const cubes = rawCubes === null ? everySingleCube : rawCubes

  let allCubes: {
    isWrong?: boolean
    cube: DCMCube
    level: number
    locker: CubeLocker
  }[] = []
  cubes.forEach(cube => allCubes.push({ cube, level: cube.hierarchyLevel, locker: new CubeLocker(cube) }))

  //Wrongfully moved cubes are cubes should shouldn't move but do because of locked cubes.
  let wrongFullyMovedCubes = cubes.map(c => c.children.value).flat().filter(c => !cubes.includes(c))
  wrongFullyMovedCubes.forEach(cube => allCubes.push({ isWrong: true, cube, level: cube.hierarchyLevel, locker: new CubeLocker(cube) }))

  allCubes.sort((a, b) => a.level - b.level)

  //For each cube 
  allCubes.forEach(data => {
    data.locker.reconstruct()
    //If is wrongfully moved cube
    if (data.isWrong === true) {
      data.cube.cubeGroup.updateMatrixWorld(true)
      return
    }

    //Run the math on the cube

    let cube = data.cube

    let rot = cube.rotation.value
    let off = cube.offset.value
    let dims = cube.dimension.value

    cube.rotation.value = [-rot[0], -rot[1], rot[2] - 180 * defineSign(rot[2])]
    cube.offset.value = [-off[0] - dims[0], -off[1] - dims[1], off[2]]

    cube.cubeGroup.updateMatrixWorld(true)
  })
}

/**
 * Math.sign(), except if the number is 0, returns -1
 * @param {number} num input
 */
function defineSign(num: number) {
  if (num === 0) {
    return -1
  }
  return Math.sign(num)
}

