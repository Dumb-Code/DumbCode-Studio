import { CubeLocker } from "../util.js"

export class LockedCubes {
    constructor(studio) {
        this.display = studio.display
        this.lockedCubes = new Set()

        let transformControls  = studio.transformControls 

        this.lockedChildrenCache = new Map()
        this.movingChildrenCache = new Set()

        transformControls.addEventListener('objectChange', () => this.reconstructLockedCubes())
        transformControls.addEventListener('mouseUp', () => {
            this.lockedChildrenCache.clear()
            this.movingChildrenCache.clear()
        })
        transformControls.addEventListener('mouseDown', () => {
            this.createLockedCubesCache()

            //When rotation point is selected. We need to lock the cubes offset in place. (level=1)
            if(studio.gumball.isTranslateRotationPoint()) {
                studio.raytracer.selectedSet.forEach(cube => {
                    let tabula = cube.tabulaCube
                    if(!this.isLocked(tabula)) {
                        this.addToHierarchyMap(this.lockedChildrenCache, tabula.hierarchyLevel, new CubeLocker(tabula, 1))
                        tabula.children.forEach(child => this.addToHierarchyMap(this.lockedChildrenCache, child.hierarchyLevel, new CubeLocker(child)))
                    }
                })
            }
        })

    }

    lock(cube) {
        this.lockedCubes.add(cube)
    }

    unlock(cube) {
        this.lockedCubes.delete(cube)
    }

    isLocked(cube) {
        return this.lockedCubes.has(cube)
    }

    createLockedCubesCache() {
        this.lockedChildrenCache.clear()
        this.movingChildrenCache.clear()
        this.lockedCubes.forEach(cube => {
            this.traverseUnlockedCubes(cube)
            if(!this.lockedCubes.has(cube.parent)) {
                this.addToHierarchyMap(this.lockedChildrenCache, cube.hierarchyLevel, new CubeLocker(cube))
            }
        })
    }

    traverseUnlockedCubes(cube) {
        if(this.isLocked(cube)) {
            cube.children.forEach(child => this.traverseUnlockedCubes(child))
        } else if(this.lockedCubes.has(cube.parent)) {
            this.movingChildrenCache.add(cube)
        }
    }

    reconstructLockedCubes() {
        this.display.tbl.modelCache.updateMatrixWorld(true)

        //Moving cubes are cubes that SHOULD move but at some point a parent is locked preventing them from moving
        let movingCubesCache = new Map()
        this.movingChildrenCache.forEach(cube => this.addToHierarchyMap(movingCubesCache, cube.hierarchyLevel, new CubeLocker(cube)))

        let size = Math.max(Math.max(...this.lockedChildrenCache.keys()), Math.max(...movingCubesCache.keys()))
        
        //We need to compute everything in order so the parents matrixWorld is correct
        for(let i = 0; i <= size; i++) {
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

    addToHierarchyMap(map, level, cubeLocker) {
        if(map.has(level)) {
            map.get(level).push(cubeLocker)
        } else {
            map.set(level, [cubeLocker])
        }
    }

}