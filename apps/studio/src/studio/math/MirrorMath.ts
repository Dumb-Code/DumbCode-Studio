import { Matrix4, Matrix4Tuple, Quaternion, Vector3, Vector3Tuple } from "three"
import { DCMCube, DCMModel } from "../formats/model/DcmModel"
import CubeLocker from "../util/CubeLocker"
import { NumArray } from "../util/NumArray"

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

export function runMirrorMath(worldPos: Vector3, normal: Vector3, cubes: DCMCube[] | null, tbl: DCMModel) {
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
  return endDataCache
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