import { DCMCube } from "../formats/model/dcm_loader.js"

export class ModelingMemento {
    constructor(model) {
        let writeArray = (arr, len) => {
            let obj = {}
            for(let i = 0; i < len; i++) {
                obj[`e${i}`] = arr[i]
            }
            return obj
        }
        let writeCube = cube => {
            return {
                name: cube.name,
                dimension: writeArray(cube.dimension, 3),
                rotationPoint: writeArray(cube.rotationPoint, 3),
                offset: writeArray(cube.offset, 3),
                rotation: writeArray(cube.rotation, 3),
                textureOffset: writeArray(cube.textureOffset, 2),
                textureMirrored: cube.textureMirrored,
                cubeGrow: writeArray(cube.cubeGrow, 3),
                children: cube.children.map(child => writeCube(child))
            }
        }
        this.children = model.children.map(child => writeCube(child))


        let readArray = (obj, len) => {
            let arr = []
            for(let i = 0; i < len; i++) {
                arr[i] = obj[`e${i}`]
            }
            return arr
        }
        let readCube = obj => new DCMCube(
            obj.name,
            readArray(obj.dimension, 3), 
            readArray(obj.rotationPoint, 3), 
            readArray(obj.offset, 3), 
            readArray(obj.rotation, 3),
            readArray(obj.textureOffset, 2),
            obj.textureMirrored,
            readArray(obj.cubeGrow, 3), 
            obj.children.map(child => readCube(child)),
            model
        )

        this.reconstruct = () => {
            model.cubeMap.clear()
            model.onChildrenChange(false, this.children.map(child => readCube(child)))
        }
    }
}