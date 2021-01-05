import { CubeLocker } from "../util.js"
import { DCMCube } from "../formats/model/dcm_model.js"

export class CubeCreateDelete {
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        dom.find('.create-cube').click(() => {
            let cube = this.createCube(studio)
            if(studio.raytracer.anySelected()) {
                studio.raytracer.firstSelected().tabulaCube.addChild(cube)
            } else {
                studio.pth.model.addChild(cube)
            }
        })
    
        dom.find('.create-cube-sibling').click(() => {
            let cube = this.createCube(studio)
            if(studio.raytracer.anySelected()) {
                studio.raytracer.firstSelected().tabulaCube.parent.addChild(cube)
            } else {
                studio.pth.model.addChild(cube)
            }
        })
    
        dom.find('.delete-cube').click(() => this.deleteCubesNoChildren())
    
        dom.find('.delete-cube-and-children').click(() => this.deleteCubes())
    }

    deleteCubesNoChildren() {
        if(this.raytracer.anySelected()) {
            this.raytracer.selectedSet.forEach(cube => {
                let tbl = cube.tabulaCube
                let lockers = tbl.children.map(cube => new CubeLocker(cube, 0))
                
                tbl.children.forEach(cube => {
                    tbl.deleteChild(cube, true)
                    tbl.parent.addChild(cube) 
                })

                tbl.parent.deleteChild(tbl)
                lockers.forEach(locker => locker.reconstruct())
                this.raytracer.clickOnMesh(cube, false)
            })
        }
    }

    deleteCubes() {
        if(this.raytracer.anySelected()) {
            this.raytracer.selectedSet.forEach(cube => {
                cube.tabulaCube.parent.deleteChild(cube.tabulaCube)
                this.raytracer.clickOnMesh(cube, false)
            })
        }
    }

    createCube(studio) {
        let map = studio.pth.model.cubeMap
        let name = "newcube"
        if(map.has(name)) {
            let num = 0
            let newName = name
            while(map.has(newName)) {
                newName = name + num++
            }
            name = newName
        }
        return new DCMCube(name, [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], studio.pth.model)
    }
}