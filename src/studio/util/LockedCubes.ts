import { DCMCube, DCMModel } from './../formats/model/DcmModel';
import CubeLocker, { LockerType } from "./CubeLocker";

export default class LockedCubes {

  //A map of the cube hirarchy level to the number of cube lockers done in this transaction
  private readonly lockedChildrenCache = new Map<number, CubeLocker[]>()

  //A set of all cubes that would have been moved, but a parent prevents it
  private readonly movingChildrenCache = new Set<DCMCube>()

  constructor(
    private readonly model: DCMModel
  ) { }

  getLockedCubes() {
    return Array.from(this.model.identifierCubeMap.values()).filter(c => c.locked.value)
  }

  addToLocker(cube: DCMCube, type: LockerType) {
    this.addToHierarchyMap(this.lockedChildrenCache, cube.hierarchyLevel, new CubeLocker(cube, type))
  }

  //Goes through `lockedCubes` and adds them to the `lockedChildrenCache`
  //If `directMove` = false, and the cube is selected, then it's skipped.
  createLockedCubesCache(lockedCubes = this.getLockedCubes(), directMove = false) {
    this.lockedChildrenCache.clear()
    this.movingChildrenCache.clear()

    //For every locked cube, add it to the hirarchy. 
    lockedCubes.forEach(cube => {
      if (!directMove && cube.selected.value) {
        return
      }
      this.traverseUnlockedCubes(cube)
      if (cube.parent instanceof DCMCube && !cube.parent.locked.value) {
        this.addToHierarchyMap(this.lockedChildrenCache, cube.hierarchyLevel, new CubeLocker(cube))
      }
    })
  }

  clearCubeLockers() {
    this.lockedChildrenCache.clear()
    this.movingChildrenCache.clear()
  }

  // Traverses all the cubes children and adds them to the `movingChildrenCache` if:
  //  - The cube isn't locked
  //  - The parent cube is locked
  traverseUnlockedCubes(cube: DCMCube) {
    if (cube.locked.value) {
      cube.children.value.forEach(child => this.traverseUnlockedCubes(child))
    } else if (cube.parent instanceof DCMCube && cube.parent.locked.value) {
      this.movingChildrenCache.add(cube)
    }
  }

  //Reconstruct the lockers in `lockedChildrenCache`, while still moving `movingChildrenCache`
  reconstructLockedCubes(movingCubes = true) {
    this.model.modelGroup.updateMatrixWorld(true) //Is this needed

    //Moving cubes are cubes that SHOULD move but at some point a parent is locked preventing them from moving
    let movingCubesCache = new Map()
    if (movingCubes === true) {
      this.movingChildrenCache.forEach(cube => this.addToHierarchyMap(movingCubesCache, cube.hierarchyLevel, new CubeLocker(cube)))
    }

    //Get the maximum hirarchy size, between the locked cube children, and the moving cubes cache
    let size = Math.max(...Array.from(this.lockedChildrenCache.keys()), ...Array.from(movingCubesCache.keys()))

    //We need to compute everything in order so the parents matrixWorld is correct
    for (let i = 0; i <= size; i++) {
      this.lockedChildrenCache.get(i)?.forEach(lock => {
        lock.reconstruct()
        lock.cube.cubeGroup.updateMatrixWorld(true)
      })

      movingCubesCache.get(i)?.forEach(lock => {
        lock.reconstruct()
        lock.cube.cubeGroup.updateMatrixWorld(true)
      })
    }

    // this.lockedChildrenCache.clear()
    // this.movingChildrenCache.clear()
  }

  addToHierarchyMap(map: Map<number, CubeLocker[]>, level: number, cubeLocker: CubeLocker) {
    const array = map.get(level) ?? []
    array.push(cubeLocker)
    map.set(level, array)
  }
}