import { DCMCube } from "../formats/model/dcm_loader.js"

export class ModelingMemento {
    constructor(model, lockedSet) {
        this.data = {}
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
        this.data.children = model.children.map(child => writeCube(child))

        this.lockedCubes = [...lockedSet]

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
            model.onChildrenChange(false, this.data.children.map(child => readCube(child)))
            
            lockedSet.clear()
            this.lockedCubes.forEach(c => lockedSet.add(c))
        }
    }
}