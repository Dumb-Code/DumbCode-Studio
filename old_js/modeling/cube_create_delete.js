import { CubeLocker } from "../util.js"
import { DCMCube, DCMModel } from "../formats/model/dcm_model.js"

/**
 * Controls the creation and deletion of cubes.
 */
export class CubeCreateDelete {
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        
        //When the create cube button is clicked.
        dom.find('.create-cube').click(() => {
            let cube = this.createCube(studio.pth.model)
            //If a cube is selected, add the cube as a child, otherwise add the cube as a root cube
            if(studio.raytracer.anySelected()) {
                studio.raytracer.firstSelected().tabulaCube.addChild(cube)
            } else {
                studio.pth.model.addChild(cube)
            }
        })
    
        //When the create cube sibling button is clicked
        dom.find('.create-cube-sibling').click(() => {
            let cube = this.createCube(studio.pth.model)
            //If a cube is selected, add it as a sibling to that cube, otherwise add it as a root cube
            if(studio.raytracer.anySelected()) {
                studio.raytracer.firstSelected().tabulaCube.parent.addChild(cube)
            } else {
                studio.pth.model.addChild(cube)
            }
        })

        //Add the delete cube hooks
        dom.find('.delete-cube').click(() => this.deleteCubesNoChildren())
        dom.find('.delete-cube-and-children').click(() => this.deleteCubes())
    }

    /**
     * Delete the cubes, but keep the children. Moves the children to be the siblings and deletes the cube.
     */
    deleteCubesNoChildren() {
        if(this.raytracer.anySelected()) {
            this.raytracer.selectedSet.forEach(mesh => {
                let cube = mesh.tabulaCube
                //Create lockers to keep the children in the same place 
                let lockers = cube.children.map(cube => new CubeLocker(cube, 0))
                
                //For every child, delete it from the cube, and add it to the cubes parent children.
                cube.children.forEach(cube => {
                    cube.deleteChild(cube, true)
                    cube.parent.addChild(cube) 
                })

                //Delete the cube from the parent, reconstruct the lockers and deselect the mesh.
                cube.parent.deleteChild(cube)
                lockers.forEach(locker => locker.reconstruct())
                this.raytracer.clickOnMesh(mesh, false)
            })
        }
    }

    /**
     * Delete the selected cubes from the project. Includes children
     */
    deleteCubes() {
        if(this.raytracer.anySelected()) {
            this.raytracer.selectedSet.forEach(cube => {
                cube.tabulaCube.parent.deleteChild(cube.tabulaCube)
                this.raytracer.clickOnMesh(cube, false)
            })
        }
    }

    /**
     * Creates a DCMCube with default dimensions,size,position, ect
     * @param {DCMModel} model 
     */
    createCube(model) {
        let map = model.cubeMap
        let name = "newcube"
        if(map.has(name)) {
            let num = 0
            let newName = name
            while(map.has(newName)) {
                newName = name + num++
            }
            name = newName
        }
        return new DCMCube(name, [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model)
    }
}