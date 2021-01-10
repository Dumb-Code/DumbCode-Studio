import { DCMCube } from "./formats/model/dcm_model.js";
import { Matrix4, Vector3, Quaternion, Euler } from "./libs/three.js";


let resultMat = new Matrix4()
let decomposePos = new Vector3()
let decomposeRot = new Quaternion()
let decomposeScale = new Vector3()
let decomposeEuler = new Euler()

/**
 * Cube locker. Cube lockers are used to have a cube keep it's position/rotation/offset
 */
export class CubeLocker {
    //type 0: position + rotation
    //type 1: offset
    //type 2: position
    //type 3: rotation
    constructor(cube, type = 0) {
        this.cube = cube
        this.type = type
        this.worldMatrix = getElementFromCube(this.cube, type).matrixWorld.clone()
    }

    /**
     * Reconstruct this cube
     */
    reconstruct() {
        CubeLocker.reconstructLocker(this.cube, this.type, this.worldMatrix)
    }
}

/**
 * Reconstructs the cubes position/offset/rotation with the matrix.
 * @param {DCMCube} cube the cube
 * @param {number} type the locker type
 * @param {Matrix4} matrix the cubes world matrix to make the cube go to.
 */
CubeLocker.reconstructLocker = (cube, type, matrix) => {
        //      parent_world_matrix * local_matrix = world_matrix
        //  =>  local_matrix = 'parent_world_matrix * world_matrix
        resultMat.getInverse(getElementFromCube(cube, type).parent.matrixWorld).multiply(matrix)
        resultMat.decompose(decomposePos, decomposeRot, decomposeScale)

        switch(type) {
            case 0:
            case 2:
                cube.updatePosition(decomposePos.toArray())
                if(type === 2) {
                    break
                }
            case 0:
            case 3:
                decomposeEuler.setFromQuaternion(decomposeRot, "ZYX")
                cube.updateRotation(decomposeEuler.toArray().map(e => e * 180 / Math.PI))
                break
            case 1:
                cube.updateOffset(decomposePos.toArray())
                break
        }
}


/**
 * Gets the three.js element from the cube
 * @param {DCMCube} cube the cube to get the element from
 * @param {number} type the locker type
 */
function getElementFromCube(cube, type) {
    switch(type) {
        case 0:
        case 2:
        case 3:
            return cube.cubeGroup
        case 1:
            return cube.cubeMesh
    }
}


//https://stackoverflow.com/a/4672319
export function lineIntersection(x0, y0, x1, y1, callback, skip = 1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    let count = 1
    callback(x0, y0)
    while(!((x0 == x1) && (y0 == y1))) {
        let e2 = err << 1;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
        if((count++ % skip) === 0) {
            callback(x0, y0)
        }
    }
}

/**
 * An async progress counter. Used to handle progress from things happening at the same time
 */
export class AsyncProgressCounter {
    constructor(nodes, stages, state, callback) {
        this.nodes = Array(nodes).fill(0)
        this.stages = stages
        this.state = state
        this.callback = callback
    }

    /**
     * Updates the progress
     * @param {number} node the node to update
     * @param {number} amount the amount to update. If bigger than 1, then the section is marked as complete
     */
    updateProgress(node = 0, amount = 1) {
        this.nodes[node] = Math.floor(this.nodes[node]) + amount
        this.callback(this.state, this.nodes.map(n => n / this.stages / this.nodes.length).reduce((a, b) => a + b))
    }

    /**
     * Updates the global state for the callback to view
     * @param {string} state the global state for the nodes
     */
    globalState(state) {
        this.state = state
    }
}

/**
 * Weighted every handler is used to have events go down a weighted pipeline, where 
 * listeners of lower index are applied first.
 * 
 * Listeners can stop propagation by calling event.consume()
 */
export class WeightedEventHandler {
    constructor() {
        this.listners = []
    }

    /**
     * Adds a listner at a certian index
     * @param {*} index the index
     * @param {*} listener the listener
     */
    addListener(index, listener) {
        this.listners.push( { index, listener })
        //Resort the listneres
        this.listners = this.listners.sort((a, b) => a.index - b.index)
    }

    /**
     * Fires an event
     * @param {*} data the event
     */
    fireEvent(data) {
        let consumed = false
        data.consume = () => consumed = true
        this.listners.forEach(l => {
            if(!consumed) {
              l.listener(data)
            }
        })

        //If is a dom event then stop the propagation and default
        if(consumed) {
            if(data.stopPropagation) {
                data.stopPropagation()
            }
            if(data.preventDefault) {
                data.preventDefault()
            }
        }
    }
}

/**
 * Generates a map with all the cubes textureoffsets, creates so the cubes don't intersect.
 * @param {DCMCube[]} cubes the cubes to apply to
 * @param {number} width the width to use
 * @param {number} height the height to use
 */
export function generateSortedTextureOffsets(cubes, width, height) {
    let map = new Map()
    let states = new Array(width).fill(0).map(() => new Array(height))
    for(let i = 0; i < cubes.length; i++) {
        let c = cubes[i]

        let w = c.dimension[0]
        let h = c.dimension[1]
        let d = c.dimension[2]
        
        let cw = w+d+w+d
        let ch = d+h

        let isSet = false
        outerLoop:
        for(let y = 0; y < height-ch; y++) {
            innerLoop:
            for(let x = 0; x < width-cw; x++) {
                //Quick test to make sure the bottom row is free.
                for(let tx = 0; tx < d+w+d+w; tx++) {
                    if(states[x+tx][y+d+h] === true) {
                        continue innerLoop
                    }
                }
                let hitStates = []

                //Top part
                for(let tx = d; tx < d+w+w; tx++) {
                    for(let ty = 0; ty < d; ty++) {
                        hitStates.push({ u:x+tx, v:y+ty })
                    }
                }

                //Bottom Part
                for(let tx = 0; tx < d+w+d+w; tx++) {
                    for(let ty = d; ty < d+h; ty++) {
                        hitStates.push({ u:x+tx, v:y+ty })
                    }
                }

                //Get any state thats hit
                let hit = hitStates.some(d => states[d.u][d.v] === true)
                if(!hit) {
                    //Set the uv for the cube, and mark all the positions as used
                    map.set(c, {x, y})
                    hitStates.forEach(d => states[d.u][d.v] = true)
                    isSet = true
                    break outerLoop
                }
            }
        }
        //If this cube could not be set, return null
        if(!isSet) {
            return null
        }
    }
    return map
}