import { DCMModel, DCMCube } from "./dcm_loader.js"
import { MeshLambertMaterial, Vector3 } from "../../three.js"
import { runMirrorMath } from "../../modeling/cube_commands.js"


let worldPos = new Vector3(0, 0, 0)
let worldX = new Vector3(1, 0, 0)
let worldY = new Vector3(0, 1, 0)

export async function readTblFile(data) {
    let model = new DCMModel()

    let zip = await JSZip.loadAsync(data)
    let json = JSON.parse(await zip.file("model.json").async("string"))

    model.author = json.authorName

    model.texWidth = json.textureWidth
    model.texHeight = json.textureHeight

    let readCube = json => {

        let children = []
        json.children.forEach(child => { children.push(readCube(child)) })

        let cubeGrow = json.cubeGrow
        if(cubeGrow === undefined) {
            cubeGrow = [json.mcScale, json.mcScale, json.mcScale]
        }
        
        return new DCMCube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.txOffset, json.txMirror, cubeGrow, children, model)
    }

    let navigateGroup = group => {
        group.cubes.forEach(cube => model.children.push(readCube(cube)))
        group.cubeGroups.forEach(g => navigateGroup(g))
    }
    
    navigateGroup(json)

    let dummyMaterial = new MeshLambertMaterial()
    model.createModel(dummyMaterial)
    model.modelCache.updateMatrix()
    model.modelCache.updateMatrixWorld(true)

    model.children.forEach(root => {
        let allCubes = root.getAllChildrenCubes([], true)
        runMirrorMath(worldPos, worldX, allCubes, model, false)
        runMirrorMath(worldPos, worldY, allCubes, model, false)
        root.updatePosition([root.rotationPoint[0] + 16, root.rotationPoint[1] + 24, root.rotationPoint[2]])
    })

    model.invalidateModelCache()

    return model

}