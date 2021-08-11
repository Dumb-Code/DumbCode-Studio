import { DCMModel, DCMCube } from "./dcm_model.js"
import { MeshLambertMaterial, Vector3 } from "../../libs/three.js"
import { runInvertMath, runMirrorMath } from "../../modeling/cube_commands.js"


//TODO: explain why this is (8/16, 12/16, 0)
//As the x and y axis are flipped, and the tbl origins are differnet to the studio origins,
//we need to flip around a point inbetween the x axis and the y axis 
// x: 8/16 (not sure -- investigate)
// y: 12/16 as the tbl origin is at 24/16
export let worldPos = new Vector3(8/16, 12/16, 0)
export let worldX = new Vector3(1, 0, 0)
export let worldY = new Vector3(0, 1, 0)

/**
 * Reads and converts a .tbl model to a DCMModel
 * @param {ArrayBuffer} data the arraybuffer containging the data
 * @returns {DCMModel} a converted model
 */
export async function readTblFile(data) {
    let model = new DCMModel()

    let zip = await JSZip.loadAsync(data)
    let json = JSON.parse(await zip.file("model.json").async("string"))

    if(json.projVersion == 4) {
        parseV4Tbl(model, json)
    } else if(json.projVersion >= 5) {
        parseV5Tbl(model, json)
    } else {
        console.error("Don't know how to convert tbl with version " + json.projVersion)
    }

    //We need to run the mirroring and invert math, to do that we need three.js stuff, 
    //and for that we need to pass a dummy material.
    model.createModel(new MeshLambertMaterial())
    model.modelCache.updateMatrix()
    model.modelCache.updateMatrixWorld(true)

    runMirrorMath(worldPos, worldX, null, model, false)
    runMirrorMath(worldPos, worldY, null, model, false)
    runInvertMath(model)

    model.invalidateModelCache()

    return model
}

function parseV4Tbl(model, json) {
    //Transferable properties
    model.author = json.authorName
    model.texWidth = json.textureWidth
    model.texHeight = json.textureHeight
    
    let readCube = json => {
        let children = []
        json.children.forEach(child => { children.push(readCube(child)) })
    
        //Allow for .tbl files to have a cubeGrow element. For some reason this is here even tho
        //.tbl never supported this. Keeping it in.
        let cubeGrow = json.cubeGrow
        if(cubeGrow === undefined) {
            cubeGrow = [json.mcScale, json.mcScale, json.mcScale]
        }
        
        return new DCMCube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.txOffset, json.txMirror, cubeGrow, children, model)
    }
    
    //Navigates a group. Groups just get pushed onto as roots.
    //The root json is counted as a group, as it has the same properties that we look at (cubes, cubeGroups)
    let navigateGroup = group => {
        group.cubes.forEach(cube => model.children.push(readCube(cube)))
        group.cubeGroups.forEach(g => navigateGroup(g))
    }
    navigateGroup(json)
}

function parseV5Tbl(model, json) {
    //Transferable properties
    model.author = json.author
    model.texWidth = json.texWidth
    model.texHeight = json.texHeight

    let readPartToCubes = json => {
        let name = json.boxes.length === 1 ? json.name : undefined
        let cubes = json.boxes.map(b => readCube(json, b, name))
        if(cubes.length === 0) {
            console.warn("TODO: move point with matrix when no box route")
            return
        }
        json.children.forEach(child => cubes[0].children.push(...readPartToCubes(child)))
        return cubes
    }
    let readCube = (part, json, name = part.name) => {
        return new DCMCube(
            name,
            [json.dimX, json.dimY, json.dimZ],
            [part.rotPX, part.rotPY, part.rotPZ],
            [json.posX, json.posY, json.posZ],
            [part.rotAX, part.rotAY, part.rotAZ],
            [part.texOffX, part.texOffY],
            part.mirror,
            [json.expandX, json.expandY, json.expandZ],
            [],
            model
        )
    }
    json.parts.forEach(part => model.children.push(...readPartToCubes(part)))
}