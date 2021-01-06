import { Matrix4, Vector3, Quaternion, Euler } from "./libs/three.js";


let resultMat = new Matrix4()
let decomposePos = new Vector3()
let decomposeRot = new Quaternion()
let decomposeScale = new Vector3()
let decomposeEuler = new Euler()

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

    reconstruct() {
        CubeLocker.reconstructLocker(this.cube, this.type, this.worldMatrix)
    }
}

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

export class AsyncProgressCounter {
    constructor(nodes, stages, state, callback) {
        this.nodes = Array(nodes).fill(0)
        this.stages = stages
        this.state = state
        this.callback = callback
    }

    updateProgress(node = 0, amount = 1) {
        this.nodes[node] = Math.floor(this.nodes[node]) + amount
        this.callback(this.state, this.nodes.map(n => n / this.stages / this.nodes.length).reduce((a, b) => a + b))
    }

    globalState(state) {
        this.state = state
    }
}



export class WeightedEventHandler {
    constructor() {
        this.listners = []
    }

    addListener(index, listener) {
        this.listners.push( { index, listener })
        this.listners = this.listners.sort((a, b) => a.index - b.index)
    }

    fireEvent(data) {
        let consumed = false
        data.consume = () => consumed = true
        this.listners.forEach(l => {
            if(!consumed) {
              l.listener(data)
            }
        })
    }
}


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

                let hit = hitStates.some(d => states[d.u][d.v] === true)
                if(!hit) {
                    map.set(c, {x, y})
                    hitStates.forEach(d => states[d.u][d.v] = true)
                    isSet = true
                    break outerLoop
                }
            }
        }
        if(!isSet) {
            return null
        }
    }
    return map
}