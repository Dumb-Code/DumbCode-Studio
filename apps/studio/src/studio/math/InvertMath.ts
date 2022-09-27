import { DCMCube, DCMModel } from "../formats/model/DcmModel";
import CubeLocker from "../util/CubeLocker";
import { NumArray } from '../util/NumArray';

export function runInvertMath(model: DCMModel, rawCubes?: DCMCube[] | null) {
  let everySingleCube: DCMCube[] = []
  model.traverseAll(cube => everySingleCube.push(cube))
  const cubes = rawCubes === null || rawCubes === undefined ? everySingleCube : rawCubes

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

  const endCache = new Map<DCMCube, {
    position: NumArray,
    rotation: NumArray,
    offset: NumArray,
  }>()

  //For each cube 
  allCubes.forEach(data => {
    data.locker.reconstruct()
    //If is wrongfully moved cube
    if (data.isWrong === true) {
      data.cube.cubeGroup.updateMatrixWorld(true)
      endCache.set(data.cube, {
        position: data.cube.position.value,
        rotation: data.cube.rotation.value,
        offset: data.cube.offset.value,
      })
      return
    }

    //Run the math on the cube

    let cube = data.cube

    let rot = cube.rotation.value
    let off = cube.offset.value
    let dims = cube.dimension.value

    cube.rotation.value = [-rot[0], -rot[1], rot[2] - 180 * defineSign(rot[2])]
    cube.offset.value = [-off[0] - dims[0], -off[1] - dims[1], off[2]]

    endCache.set(data.cube, {
      position: data.cube.position.value,
      rotation: data.cube.rotation.value,
      offset: data.cube.offset.value,
    })
    cube.cubeGroup.updateMatrixWorld(true)
  })

  return endCache
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

