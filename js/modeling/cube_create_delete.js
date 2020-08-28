import { TblCube } from "../tbl_loader.js"
import { CubeLocker } from "../util.js"

export function applyCubeAddingDeleting(dom, studio) {
    dom.find('.create-cube').click(() => {
        let cube = createCube(studio)
        if(studio.raytracer.anySelected()) {
            studio.raytracer.firstSelected().tabulaCube.addChild(cube)
        } else {
            studio.display.tbl.rootGroup.addChild(cube)
        }
    })

    dom.find('.create-cube-sibling').click(() => {
        let cube = createCube(studio)
        if(studio.raytracer.anySelected()) {
            studio.raytracer.firstSelected().tabulaCube.parent.addChild(cube)
        } else {
            studio.display.tbl.rootGroup.addChild(cube)
        }
    })

    dom.find('.delete-cube').click(() => {
        if(studio.raytracer.anySelected()) {
            studio.raytracer.selectedSet.forEach(cube => {
                let tbl = cube.tabulaCube
                let childrenCubes = tbl.getAllChildrenCubes([])
                let lockers = childrenCubes.map(cube => new CubeLocker(cube, 0))
                
                childrenCubes.forEach((cube, index) => {
                    tbl.deleteChild(cube, true)
                    tbl.parent.addChild(cube) 
                })

                tbl.parent.deleteChild(tbl)
                lockers.forEach(locker => locker.reconstruct())
                studio.raytracer.clickOnMesh(cube, false)
            })
        }
    })

    dom.find('.delete-cube-and-children').click(() => {
        if(studio.raytracer.anySelected()) {
            studio.raytracer.selectedSet.forEach(cube => {
                cube.tabulaCube.parent.deleteChild(cube.tabulaCube)
                studio.raytracer.clickOnMesh(cube, false)
            })
        }
    })
}

function createCube(studio) {
    let map = studio.display.tbl.cubeMap
    let name = "newcube"
    if(map.has(name)) {
        let num = 0
        let newName = name
        while(map.has(newName)) {
            newName = name + num++
        }
        name = newName
    }
    return new TblCube(name, [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 1, 1], [0, 0], [0, 0, 0], [], false, studio.display.tbl)
}