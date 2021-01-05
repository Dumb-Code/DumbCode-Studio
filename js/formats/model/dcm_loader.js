import { MeshLambertMaterial } from "../../libs/three.js";
import { ByteBuffer } from "../../animations.js";
import { readTblFile } from "./tbl_converter.js";
import { runInvertMath } from "../../modeling/cube_commands.js";
import { readBBModel } from "./bbmodel_loader.js";
import { DCMCube, DCMModel } from "./dcm_model.js";

export class DCMLoader {}

/**
 * 
 * @param {ArrayBuffer} arrayBuffer the array buffer to read from
 * @param {*} name the file name
 * @param {*} texturePart the files texture part. Should only exist when file is uploaded from the files page.
 */
DCMLoader.loadModel = async(arrayBuffer, name = "", texturePart) => {
    let model
    let version = 2
    //Maybe in the future we shouldn't do it based of file name?
    if(name.endsWith('.tbl')) {
        model = await readTblFile(arrayBuffer)
    } else if(name.endsWith('.bbmodel')) {
        model = await readBBModel(arrayBuffer, texturePart)
    } else {
        let buffer = new ByteBuffer(await arrayBuffer)

        model = new DCMModel()
    
        //Read the model meta
        version = buffer.readNumber()
        model.author = buffer.readString()
        model.texWidth = buffer.readInteger()
        model.texHeight = buffer.readInteger()
    
        //Recursive method to read a list of cubes
        let readCubes = () => {
            let cubes = []
            let amount = buffer.readNumber()
            for(let i = 0; i < amount; i++) {
                cubes.push(new DCMCube(
                    buffer.readString(), //Name
                    [buffer.readInteger(), buffer.readInteger(), buffer.readInteger()], //Dimension
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Rotation Point
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Offset
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Rotation
                    [buffer.readInteger(), buffer.readInteger()], //Texture Offset
                    buffer.readBool(), //Texture Mirrored
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Cube Grow
                    readCubes(), //Children
                    model
                ))
            }
            return cubes
        }
        model.children = readCubes()    
    }

    if(name) {
        model.fileName = name.substring(0, name.lastIndexOf('.'))
    }

    //We need to invert the model. For this to work, we need three.js data. For that to happen, we need objects with geometry.
    //For that to happen we need material. This just creates a basic material so the math works.
    //Maybe in the future we can push this until after the material is added, so we don't have to do a dummy material.
    if(version < 2) {
        model.createModel(new MeshLambertMaterial())
        model.modelCache.updateMatrix()
        model.modelCache.updateMatrixWorld(true)

        runInvertMath(model)
        
        model.invalidateModelCache()
    }
    return model
}

/**
 * Writes the model to a bytebuff
 * @param {DCMModel} model the model
 * @returns a ByteBuffer with the model written to it 
 */
DCMLoader.writeModel = model => {
    let buffer = new ByteBuffer()

    //0 - internally used version
    //    (???) [?]
    //
    //1 - Initial public version
    //    (13 SEP 2020) [e8c947bcc79583e3cd26eccb391b5f1e21ca7f27]
    //
    //2 - Model is inverted. This is done to fix tbl imported models. Having a version of 2 marks it as inverted
    //    (27 DEC 2020) [ba91a6db089353646b976c1fabb251910640db62]
    buffer.writeNumber(2) //Version
    
    //Write the model meta
    buffer.writeString(model.author)
    buffer.writeNumber(model.texWidth)
    buffer.writeNumber(model.texHeight)

    //Function to write an array easily.
    //This doesn't do `arr.forEach`, as we need a defined amount of numbers written
    let writeArr = (arr, amount) => {
        for(let i = 0; i < amount; i++) {
            buffer.writeNumber(arr[i])
        }
    }

    //Recursive function to write a list of cubes.
    let writeCubes = cubes => {
        buffer.writeNumber(cubes.length)
        cubes.forEach(cube => {
            buffer.writeString(cube.name)
            writeArr(cube.dimension, 3)
            writeArr(cube.rotationPoint, 3)
            writeArr(cube.offset, 3)
            writeArr(cube.rotation, 3)
            writeArr(cube.textureOffset, 2)
            buffer.writeBool(cube.textureMirrored)
            writeArr(cube.cubeGrow, 3)
            writeCubes(cube.children)
        })
    }

    writeCubes(model.children)

    return buffer
}
