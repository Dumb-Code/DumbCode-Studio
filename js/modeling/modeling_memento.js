import { DCMCube } from "../formats/model/dcm_model.js"

/**
 * MOdeling memento is the captured modeler state. Everything in `this.data` will be tracked,
 * and can be traversed to, resulting in undo/redo.
 */
export class ModelingMemento {
    constructor(model, lockedSet) {
        this.data = {}
        //Recursive functionn to write a cube to an object
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

        //Locked cubes is an untracked property
        this.lockedCubes = [...lockedSet]

        //Recursive function to read a cube
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

        //Reconstructs all the cubues
        this.reconstruct = () => {
            model.cubeMap.clear()
            model.onChildrenChange(false, this.data.children.map(child => readCube(child)))
            
            lockedSet.clear()
            this.lockedCubes.forEach(c => lockedSet.add(c))
        }
    }
}