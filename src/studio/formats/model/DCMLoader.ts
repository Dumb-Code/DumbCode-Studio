import { StudioBuffer } from '../../util/StudioBuffer';
import { DCMCube, DCMModel } from './DcmModel';


export const loadDCMModel = async(arrayBuffer: ArrayBuffer | PromiseLike<ArrayBuffer>, name = "") => {
    let model: DCMModel
    let version = 2
    //Maybe in the future we shouldn't do it based of file name?
    if(name.endsWith('.tbl') && false) {
        // model = await readTblFile(arrayBuffer)
    } else if(name.endsWith('.bbmodel') && false) {
        // model = await readBBModel(arrayBuffer, texturePart)
    } else {
        let buffer = new StudioBuffer(await arrayBuffer)

        model = new DCMModel()
    
        //Read the model meta
        version = buffer.readNumber()
        model.author.value = buffer.readString()
        model.textureWidth.value = buffer.readInteger()
        model.textureHeight.value = buffer.readInteger()
    
        //Recursive method to read a list of cubes
        let readCubes = () => {
            let cubes: DCMCube[] = []
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
        model.children.value = readCubes()    
    }

    //We need to invert the model. For this to work, we need three.js data. For that to happen, we need objects with geometry.
    //For that to happen we need material. This just creates a basic material so the math works.
    //Maybe in the future we can push this until after the material is added, so we don't have to do a dummy material.
    if(version < 2) {
        model.modelGroup.updateMatrix()
        model.modelGroup.updateMatrixWorld(true)

        // runInvertMath(model)        
    }
    return model
}

/**
 * Writes the model to a bytebuff
 * @param {DCMModel} model the model
 * @returns a ByteBuffer with the model written to it 
 */
export const writeModel = (model: DCMModel) => {
    let buffer = new StudioBuffer()

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
    buffer.writeString(model.author.value)
    buffer.writeNumber(model.textureWidth.value)
    buffer.writeNumber(model.textureHeight.value)

    //Function to write an array easily.
    //This doesn't do `arr.forEach`, as we need a defined amount of numbers written
    let writeArr = (arr: readonly number[], amount: number) => {
        for(let i = 0; i < amount; i++) {
            buffer.writeNumber(arr[i])
        }
    }

    //Recursive function to write a list of cubes.
    let writeCubes = (cubes: readonly DCMCube[]) => {
        buffer.writeNumber(cubes.length)
        cubes.forEach(cube => {
            buffer.writeString(cube.name.value)
            writeArr(cube.dimension.value, 3)
            writeArr(cube.position.value, 3)
            writeArr(cube.offset.value, 3)
            writeArr(cube.rotation.value, 3)
            writeArr(cube.textureOffset.value, 2)
            buffer.writeBool(cube.textureMirrored.value)
            writeArr(cube.cubeGrow.value, 3)
            writeCubes(cube.children.value)
        })
    }

    writeCubes(model.children.value)

    return buffer
}
