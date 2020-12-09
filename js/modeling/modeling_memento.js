import { DCMCube } from "../formats/model/dcm_loader.js"

export class ModelingMemento {
    constructor(model) {
        let writeCube = cube => {
            return {
                name: cube.name,
                dimension: [...cube.dimension],
                rotationPoint: [...cube.rotationPoint],
                offset: [...cube.offset],
                rotation: [...cube.rotation],
                textureOffset: [...cube.textureOffset],
                textureMirrored: cube.textureMirrored,
                cubeGrow: [...cube.cubeGrow],
                children: cube.children.map(child => writeCube(child))
            }
        }
        this.children = model.children.map(child => writeCube(child))

        let readCube = obj => new DCMCube(
            obj.name,
            [...obj.dimension], 
            [...obj.rotationPoint], 
            [...obj.offset], 
            [...obj.rotation],
            [...obj.textureOffset],
            obj.textureMirrored,
            [...obj.cubeGrow], 
            obj.children.map(child => readCube(child)),
            model
        )

        this.reconstruct = () => {
            model.cubeMap.clear()
            model.onChildrenChange(false, this.children.map(child => readCube(child)))
        }
    }
}