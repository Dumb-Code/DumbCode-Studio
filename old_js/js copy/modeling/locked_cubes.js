import { CubeLocker } from "../util.js"

/**
 * Used to control the locking cubes mechanics. 
 */
export class LockedCubes {
    constructor(studio) {
        this.pth = studio.pth

        let transformControls  = studio.transformControls 
        this.raytracer = studio.raytracer

        this.lockedChildrenCache = new Map()
        this.movingChildrenCache = new Set()

        //When the transform controls are finished
        transformControls.addEventListener('objectChange', () => this.reconstructLockedCubes())
        
        //When the mouse up is clicked
        transformControls.addEventListener('mouseUp', () => {
            this.lockedChildrenCache.clear()
            this.movingChildrenCache.clear()
        })

        //When the transform controls start
        transformControls.addEventListener('mouseDown', () => this.createLockedCubesCache())

    }

    get lockedCubes() {
        return this.pth.lockedCubes
    }

    /**
     * @param {DcmCube} cube Locks the cube
     */
    lock(cube) {
        this.lockedCubes.add(cube.name)
    }

    /**
     * @param {DcmCube} cube Unlocks the cube
     */
    unlock(cube) {
        this.lockedCubes.delete(cube.name)
    }

    /**
     * Get whether a cube is locked or not 
     * @param {DcmCube} cube the cube to test
     */
    isLocked(cube) {
        return this.lockedCubes.has(cube.name)
    }

    /**
     * Adds the cube to the `lockedChildrenCache` map
     * @param {*} cube the cube to start with 
     * @param {*} type the locker type
     */
    addToLocker(cube, type) {
        this.addToHierarchyMap(this.lockedChildrenCache, cube.hierarchyLevel, new CubeLocker(cube, type))
    }

    /**
     * 
     * @param {string[]} lockedCubes the cubes to lock, or undefined if to use the default ones
     * @param {boolean} directMove true if it's a direct move, or false otherwise. Direct moves can lock the selected cube, non direct moves can't.
     * @todo Instead of doing directMove, have it so when that this isn't called per frame. Figure out where that's occuring. 
     */
    createLockedCubesCache(lockedCubes = this.lockedCubes, directMove = false) {
        this.lockedChildrenCache.clear()
        this.movingChildrenCache.clear()
        //For every locked cube, add it to the hirarchy. 
        lockedCubes.forEach(cubeName => {
            let cube = this.pth.model.cubeMap.get(cubeName)
            if(!cube || (directMove !== true && this.raytracer.isCubeSelected(cube))) {
                return
            } 
            this.traverseUnlockedCubes(cube)
            if(!this.isLocked(cube.parent)) {
                this.addToHierarchyMap(this.lockedChildrenCache, cube.hierarchyLevel, new CubeLocker(cube))
            }
        })
    }

    /**
     * Traverses all the cubes children and adds them to the movingChildrenCache if:
     *  - The cube isn't locked
     *  - The parent cube is locked
     * @param {DcmCube} cube the cube
     */
    traverseUnlockedCubes(cube) {
        if(this.isLocked(cube)) {
            cube.children.forEach(child => this.traverseUnlockedCubes(child))
        } else if(this.isLocked(cube.parent)) {
            this.movingChildrenCache.add(cube)
        }
    }

    /**
     * Reconstructs all the lockers.
     * @param {boolean} movingCubes If the moving children cache should also be used.
     */
    reconstructLockedCubes(movingCubes = true) {
        this.pth.model.modelCache.updateMatrixWorld(true)

        //Moving cubes are cubes that SHOULD move but at some point a parent is locked preventing them from moving
        let movingCubesCache = new Map()
        if(movingCubes === true) {
            this.movingChildrenCache.forEach(cube => this.addToHierarchyMap(movingCubesCache, cube.hierarchyLevel, new CubeLocker(cube)))
        }

        //Get the maximum hirarchy size
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

    /**
     * Adds $cubeLocker to $map at level $level
     */
    addToHierarchyMap(map, level, cubeLocker) {
        if(map.has(level)) {
            map.get(level).push(cubeLocker)
        } else {
            map.set(level, [cubeLocker])
        }
    }

}