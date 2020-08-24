import { TblCube } from "../tbl_loader.js"

export function applyCubeAddingDeleting(dom, studio) {
    dom.find('.cube-create').click(() => {
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
        let cube = new TblCube(name, [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 1, 1], [0, 0], [0, 0, 0], [], false, studio.display.tbl)
        if(studio.raytracer.anySelected()) {
            studio.raytracer.firstSelected().tabulaCube.addChild(cube)
        } else {
            studio.display.tbl.rootGroup.addChild(cube)
        }
    })

    dom.find('.cube-delete').click(() => {
        if(studio.raytracer.anySelected()) {
            studio.raytracer.selectedSet.forEach(cube => {
                cube.parent.deleteChild(cube)
                studio.raytracer.clickOnMesh(cube, false)
            })
        }
    })
}