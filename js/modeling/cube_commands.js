import { indexHandler } from "../command_handler.js"
import { CubeLocker } from "../util.js"
import { Vector3, Quaternion, Matrix4, Euler } from "../three.js"

const worldPosVector = new Vector3()
const worldRotQuat = new Quaternion()
const planeNormal = new Vector3()
const tempMirrorVec = new Vector3()
const tempCubePos = new Vector3()
const tempCubeQuat = new Quaternion()
const tempCubeAxisBase = new Vector3()
const tempCubeXAxis = new Vector3()
const tempCubeYAxis = new Vector3()
const tempCubeZAxis = new Vector3()
const tempCubeScale = new Vector3()
const tempScaleMatrix = new Matrix4()
const tempPositionMatrix = new Matrix4()
const tempRotationMatrix = new Matrix4()
const tempRotationMatrixInverse = new Matrix4()
const tempResultMatrix = new Matrix4()
const tempCubeOldBase = new Vector3()
const tempCubeNewBase0 = new Vector3()
const tempCubeNewBase1 = new Vector3()
const tempEuler = new Euler()

export class CubeCommands {
    constructor(root, studio, dom) {
        this.commandResultChangeCache = null
        this.gumballObject = studio.gumball.transformAnchor

        dom.find('.saved-command').click(e => {
            root.doCommand(e.delegateTarget.getAttribute('command'))
        })

        studio.addEventListener('keydown', e => {
            if(document.activeElement.nodeName != "INPUT" && e.event.key === " ") {
                root.commandLine.runPreviousCommand()
            }
        })

        this.applycopypaste(root, studio.raytracer)
        this.applyVertexSnapping(root, studio.display, studio.pointTracker, studio.lockedCubes, studio.raytracer)
        this.applyMirrorCommand(root)
        this.applyInvertCommand(root)

        root.command('refimg').onRun(() => studio.referenceImageHandler.openRefImgModal())
    }

 
    applycopypaste(root, raytracer) {
        root.command('copypaste')
            .onRun(args => {
                let cube = args.context.getCube()
                let cloned = cube.cloneCube()
                cube.parent.addChild(cloned)
                cloned.createGroup()
                raytracer.deselectAll()
                raytracer.clickOnMesh(cloned.cubeMesh)
            })
    
    }

    applyVertexSnapping(root, display, pointTracker, lockedCubes, raytracer) {
        let active = false

        raytracer.addEventListener('clicked', e => {
            if(active && raytracer.intersected === undefined) {
                active = false
                pointTracker.disable()
                e.ignore = true
            }
        })
        raytracer.addEventListener('selectchange', () => {
            if(active && raytracer.anySelected() !== true) {
                active = false
                pointTracker.disable()
            }
        })
        root.command('snap')
            .onRun(args => {
                active = true
                let cube = args.context.getCube()
                let rp = args.context.hasFlag('rp')
                let cubeLockers = []
                if(rp) {
                    cubeLockers.push(new CubeLocker(cube, 1))
                    cube.children.forEach(child => cubeLockers.push(new CubeLocker(child, 0)))
                }

                let phase2 = () => {
                    pointTracker.enable(p => {
                        active = false
                        let worldDiff = worldPosVector.sub(p.position).multiplyScalar(-1)
                        cube.cubeGroup.matrixWorld.decompose(tempCubePos, tempCubeQuat, tempCubeScale)
                        
                        tempResultMatrix.compose(tempCubePos.add(worldDiff), tempCubeQuat, tempCubeScale)
                        
                        if(rp) {
                            CubeLocker.reconstructLocker(cube, 0, tempResultMatrix)
                            cube.cubeGroup.updateMatrixWorld()
                            cubeLockers.forEach(l => l.reconstruct())
                        } else {
                            lockedCubes.createLockedCubesCache()
                            CubeLocker.reconstructLocker(cube, 0, tempResultMatrix)
                            lockedCubes.reconstructLockedCubes()
                        }

                        raytracer.deselectAll()
                        raytracer.clickOnMesh(cube.cubeMesh)
                        
                    }, 0x662141)
                }

                if(rp) {
                    cube.cubeGroup.getWorldPosition(worldPosVector)
                    phase2()
                } else {
                    pointTracker.enable(p => {
                        raytracer.deselectAll()
                        worldPosVector.copy(p.position)
                        phase2()
                    }, undefined, undefined, cube)
                } 
            })
    }

    applyInvertCommand(root) {
        root.command("invert")
        .onRun(args => {
            let model = args.context.getTblModel()
            let cubes
            if(args.context.selected() !== 0) {
                cubes = args.context.getAllCubes()
            }
            runInvertMath(model, cubes)
        })
    }
    
    applyMirrorCommand(root) {
        root.command('mirrorcube')
            .addCommandBuilder('mirror')
            .argument('axis', indexHandler('xyz', true))
            .addCommandBuilder('mirrorx', 'x')
            .addCommandBuilder('mirrory', 'y')
            .addCommandBuilder('mirrorz', 'z')
            .onRun(args => {
                let cubes = args.context.getAllCubes()
                let axis = args.get('axis')

                let worldPos = this.gumballObject.getWorldPosition(worldPosVector)
                let worldQuat = this.gumballObject.getWorldQuaternion(worldRotQuat)
    
                let normal = planeNormal.set(axis===0?1:0, axis===1?1:0, axis===2?1:0).normalize()//.applyQuaternion(worldQuat)
                this.commandResultChangeCache = runMirrorMath(worldPos, normal, cubes, args.context.getTblModel(), args.context.dummy)
            }).onExit(() => this.onCommandExit())
    }
    
    onCommandExit() {
        if(this.commandResultChangeCache) {
            this.commandResultChangeCache.onExit()
            this.commandResultChangeCache = null
        }
    }

    onFrame() {
        if(this.commandResultChangeCache) {
            this.commandResultChangeCache.applyOnFrame()
        }
    }
}

export function runInvertMath(model, cubes) {
    if(cubes == null) {
        cubes = []
        model.traverseAll(cube => cubes.push(cube))
    }
    let allCubes = []

    cubes.forEach(cube => allCubes.push({ cube, level: cube.hierarchyLevel, locker: new CubeLocker(cube) }))
    
    let wrongFullyMovedCubes = cubes.map(c => c.children).flat().filter(c => !cubes.includes(c))
    wrongFullyMovedCubes.forEach(cube => allCubes.push({ isWrong: true, cube, level: cube.hierarchyLevel, locker: new CubeLocker(cube) }))

    allCubes.sort((a, b) => a.level - b.level)

    allCubes.forEach(data => {
        data.locker.reconstruct()
        if(data.isWrong === true) {
            data.cube.cubeGroup.updateMatrixWorld(true)
            return
        }

        let cube = data.cube

        let rot = cube.rotation
        let off = cube.offset
        let dims = cube.dimension

        cube.updateRotation([ -rot[0], -rot[1], rot[2]-180*defineSign(rot[2]) ])
        cube.updateOffset( [ -off[0]-dims[0], -off[1]-dims[1], off[2] ])

        cube.cubeGroup.updateMatrixWorld(true)
    })
}

function defineSign(num) {
    if(num === 0) {
        return -1
    }
    return Math.sign(num)
}

export function runMirrorMath(worldPos, normal, cubes, tbl, dummy) {
    tbl.resetVisuals()

    if(cubes == null) {
        cubes = []
        tbl.traverseAll(cube => cubes.push(cube))
    }
    
    let totalCubesToApplyTo = []
    cubes.forEach(cube => totalCubesToApplyTo.push({type:0, cube}))

    let wrongFullyMovedCubes = cubes.map(c => c.children).flat().filter(c => !cubes.includes(c))
    wrongFullyMovedCubes.forEach(cube => totalCubesToApplyTo.push({type:1, cube}))

    totalCubesToApplyTo.sort((a, b) => a.cube.hierarchyLevel - b.cube.hierarchyLevel)
    
    let lockets = new Map()
    wrongFullyMovedCubes.forEach(cube => lockets.set(cube, new CubeLocker(cube)))

    //Definition of a plane at point (x0, y0, z0) (var: worldPos) with normal (A, B, C) (var: normal): 
    //A(x − x0) + B(y − y0) + C(z − z0) = 0
    //
    //I want to find the projection point (x,y,z) (var: vec) onto the plane. This would be defined as (x+At, y+Bt, z+Ct), where t is a random variable
    //Putting that back into the plane equation:
    //      A((x+At)-x0) + B((y+Bt)-y0) + C((z+Ct)-z0) = 0
    //  =>  A(x+At-x0) + B(y+Bt-y0) + C(z+Ct-z0) = 0
    //  =>  Ax+AAt-Ax0 + By+BBt-By0 + Cz+CCT-Cz0 = 0
    //  =>  AAt + BBt + CCt = Ax0-Ax + By0-By + Cz0-Cz
    //  =>  t = (Ax0-Ax + By0-By + Cz0-Cz) / (AA+BB+CC) - It's worth noting that AA+BB+CC is the same as `normal.lengthSquared()`
    //
    //Once t is found, I can put it back into (x+At, y+Bt, z+Ct) to give me the projection point on the plane.
    //With the projection point on the plane, I can find the difference between that and the starting point, and move the point by that distance again.
    let mirrorPoint = vec => {
        let t = (normal.x*(worldPos.x - vec.x) + normal.y*(worldPos.y - vec.y) + normal.z*(worldPos.z - vec.z)) / normal.lengthSq()
        let diff = tempMirrorVec.set(normal.x*t, normal.y*t, normal.z*t).multiplyScalar(2)
        vec.add(diff)
        return vec
    }
    
    let startDataCache = new Map()
    cubes.forEach(cube => {
        cube.cubeGroup.matrixWorld.decompose(tempCubePos, tempCubeQuat, tempCubeScale)
        let newPosition = mirrorPoint(tempCubePos)
        
        let oldCorner = mirrorPoint(cube.getWorldPosition(1, 1, 1), tempCubeOldBase)

        //Get the mirrored positions of all 3 axis points, take that away from the cube origin then create a rotation matrix from that.
        //Using that rotation matrix, a translation matrix and a scale matrix, construct a full matrix for the cube. Then use the cube locker
        //To turn that into the cubes position and rotation.
        let base = mirrorPoint(cube.getWorldPosition(0, 0, 0, tempCubeAxisBase))
        let xAxis = mirrorPoint(cube.getWorldPosition(1, 0, 0, tempCubeXAxis)).sub(base).normalize()
        let yAxis = mirrorPoint(cube.getWorldPosition(0, 1, 0, tempCubeYAxis)).sub(base).normalize()
        let zAxis = mirrorPoint(cube.getWorldPosition(0, 0, 1, tempCubeZAxis)).sub(base).normalize()

        //Construct the matricies
        let scaleMatrix = tempScaleMatrix.makeScale(tempCubeScale.x, tempCubeScale.y, tempCubeScale.z)
        let positionMatrix = tempPositionMatrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z)
        let rotationMatrix = tempRotationMatrix.set(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0,       0,       0,       1
        )

        let newMatrix = tempResultMatrix.copy(scaleMatrix).premultiply(rotationMatrix).premultiply(positionMatrix)

        startDataCache.set(cube, { 
            oldCorner: oldCorner.toArray(), 
            base: base.toArray(), 
            newMatrix: newMatrix.toArray(), 
            rotationMatrix: rotationMatrix.toArray(),

            rotationPoint: [...cube.rotationPoint],
            rotation: [...cube.rotation],
            offset: [...cube.offset]
        })
    })

    let endDataCache = new Map()
    totalCubesToApplyTo.forEach(data => {
        let cube = data.cube
        if(data.type === 1) {
            lockets.get(cube).reconstruct()
        } else if(data.type === 0) {
            let cache = startDataCache.get(cube)

            CubeLocker.reconstructLocker(cube, 0, tempResultMatrix.fromArray(cache.newMatrix))
            cube.cubeGroup.updateMatrixWorld(true)

            //Get opposite corners on the cube (0, 0, 0) -> (1, 1, 1), and get the difference between where the mirrored position is,
            //and where it is currently. The avarage between those two differences will be how much to change the offset by.
            //Transform that into local space, then add it onto the offset. 
            let inverseRotation = tempRotationMatrixInverse.getInverse(tempResultMatrix.fromArray(cache.rotationMatrix))

             //The point at (0, 0, 0)
            let currentPoint0 = cube.getWorldPosition(0, 0, 0, tempCubeNewBase0)
            let toMove0 = currentPoint0.sub(tempCubePos.fromArray(cache.base))

            //The point at (1, 1, 1)
            let currentPoint1 = cube.getWorldPosition(1, 1, 1, tempCubeNewBase1)
            let toMove1 = currentPoint1.sub(tempCubePos.fromArray(cache.oldCorner))

             //Add the points together and rotate them into local space.
            //As we have a offsets in terms of 16 rather than 1, we need to multiply by 16.
            //As this is a sum of the 2 points, we need to find the avarage, so we divide by 2.
            //This can be simplified to multiplying by 8 ( * 16 / 2)
            let toMove = toMove0.add(toMove1).applyMatrix4(inverseRotation).multiplyScalar(8) //8 = 16 /2
            cube.updateOffset(cube.offset.map((v, i) => v + toMove.getComponent(i)))
        }
        endDataCache.set(cube, {
            rotationPoint: [...cube.rotationPoint],
            rotation: [...cube.rotation],
            offset: [...cube.offset],
        })
    })

    if(dummy === true) {
        let resetVisuals = (visualOnly) => {
            startDataCache.forEach((cache, cube) => {
                cube.updatePosition([...cache.rotationPoint], visualOnly)
                cube.updateRotation([...cache.rotation], visualOnly)
                cube.updateOffset([...cache.offset], visualOnly)
            })
        }

        resetVisuals(false)
        return { 
            onExit: () => {
                resetVisuals(true)
                tbl.modelCache.updateMatrixWorld(true)
                // totalCubesToApplyTo.forEach(d => d.cube.cubeGroup.updateMatrixWorld(true))
            },
            applyOnFrame: () => {    
                endDataCache.forEach((cache, cube) => {
                    cube.updatePosition([...cache.rotationPoint], true)
                    cube.updateRotation([...cache.rotation], true)
                    cube.updateOffset([...cache.offset], true)
                })
                tbl.modelCache.updateMatrixWorld(true)
                // totalCubesToApplyTo.forEach(d => d.cube.cubeGroup.updateMatrixWorld(true))
            }
         }
    }

}


