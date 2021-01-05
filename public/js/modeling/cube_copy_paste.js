import { CubeLocker } from "../util.js"

export class CubeCopyPaste {
    constructor(studio, root) {
        this.pth = studio.pth
        this.raytracer = studio.raytracer
        this._cache = []

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

        root.command('copy').onRun(() => this.copy())
        root.command('cut').onRun(() => this.cut())

        root.command('paste').onRun(ctx => this.paste(ctx.context.hasFlag('w', 'world')))
    }

    copy() {
        this._cache.length = 0
        this.raytracer.selectedSet.forEach(cube => this.createLocker(cube.tabulaCube, cube.tabulaCube.cloneCube()))
    }

    paste(keepWorldPosition) {
        let root = this.raytracer.oneSelected()?.tabulaCube || this.pth.model

        let cubes = this._cache.map(c => { return { cube: c.cube.cloneCube(), world: c.world } })

        cubes.forEach((c, i) => root.addChild(c.cube, i !== cubes.length - 1))
        if(keepWorldPosition) {
            root.updateMatrixWorld(true)
            cubes.forEach(c => CubeLocker.reconstructLocker(c.cube, 0, c.world))
        }
        
    }

    cut() {
        this._cache.length = 0
        let set = this.raytracer.selectedSet
        let done = set.size
        set.forEach(cubeMesh => {
            let cube = cubeMesh.tabulaCube
            cube.parent.deleteChild(cube, true)
            this.raytracer.clickOnMesh(cubeMesh, false)
            this.createLocker(cube, cube)
            if(--done === 0) {
                cube.model.onCubeHierarchyChanged()
            }
        })
    }

    createLocker(src, dest) {
        this._cache.push( { cube: dest, world: src.cubeGroup.matrixWorld.clone() } )
    }
}