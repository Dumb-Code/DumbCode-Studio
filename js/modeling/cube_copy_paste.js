import { CubeLocker } from "../util.js"

/**
 * Used to track the copying and pasting of cubes
 */
export class CubeCopyPaste {
    constructor(studio, root) {
        this.pth = studio.pth
        this.raytracer = studio.raytracer
        this._cache = []

        //Listen for keys. If the active node is an input then ignore
        studio.addEventListener('keydown', evt => {
            if(document.activeElement.nodeName == "INPUT") {
                return
            }
            let e = evt.event
            if(e.ctrlKey) {
                switch(e.keyCode) {
                    case 67: //C
                        this.copy()
                        break

                    case 86: //V
                        this.paste(e.shiftKey)
                        break

                    case 88: //X
                        this.cut()
                        break
                }
            } 
        })

        //Apply the commands
        root.command('copy').onRun(() => this.copy())
        root.command('cut').onRun(() => this.cut())
        root.command('paste').onRun(ctx => this.paste(ctx.context.hasFlag('w', 'world')))
    }

    /**
     * Copy the currently selected cubes
     */
    copy() {
        //Clear the cache, for every cube, add a clone of the cube to the cache
        this._cache.length = 0
        this.raytracer.selectedSet.forEach(cube => this.addCubeToCache(cube.tabulaCube, cube.tabulaCube.cloneCube()))
    }

    /**
     * Pastes the currently copied cubes
     * @param {boolean} keepWorldPosition true if the cube should keep the world position, false otherwise
     */
    paste(keepWorldPosition) {
        let root = this.raytracer.oneSelected()?.tabulaCube || this.pth.model

        let cubes = this._cache.map(c => { return { cube: c.cube.cloneCube(), world: c.world } })

        cubes.forEach((c, i) => root.addChild(c.cube, i !== cubes.length - 1))
        if(keepWorldPosition) {
            root.updateMatrixWorld(true)
            cubes.forEach(c => CubeLocker.reconstructLocker(c.cube, 0, c.world))
        }   
    }

    /**
     * Cuts the currently selected cubes 
     */
    cut() {
        this._cache.length = 0
        let set = this.raytracer.selectedSet
        let done = set.size
        //For each cube, delete it from the parent and add it to the cache
        set.forEach(cubeMesh => {
            let cube = cubeMesh.tabulaCube
            cube.parent.deleteChild(cube, true)
            this.addCubeToCache(cube, cube)

            //If is the last one, recalculatae the model hierarchy
            if(--done === 0) {
                cube.model.onCubeHierarchyChanged()
            }
        })
        this.raytracer.deselectAll()
    }

    /**
     * Both src and dest should be the same virtual cube, however the src should have three elements.
     * @param {DCMCube} src the source cube
     * @param {DCMCube} dest the cube to put as copied.
     */
    addCubeToCache(src, dest) {
        this._cache.push( { cube: dest, world: src.cubeGroup.matrixWorld.clone() } )
    }
}