import { TblCube } from "../tbl_loader.js"
import { axisNumberHandler, indexHandler } from "../command_handler.js"
import { CubeLocker } from "../util.js"
import { Vector3, Quaternion, Euler, Matrix4, Group, SphereGeometry, MeshBasicMaterial, Mesh } from "../three.js"

const baseQuaternionInvese = new Quaternion()
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


export class CubeCommands {
    constructor(root, studio) {
        this.commandResultChangeCache = null
        let geometry = new SphereGeometry(1/64, 16, 16);

        let group = new Group()
        studio.display.scene.add(group)

        this.points = []
        this.points2 = []
        for(let x = 0; x <= 1; x++) {
            for(let y = 0; y <= 1; y++) {
                for(let z = 0; z <= 1; z++) {
                    let color = 0xFF000000
                    if(x+y+z === 0) {
                        color = 0xFFFFFFFF
                    } else if(x === 1 && y+z === 0) {
                        color = 0xFFFF0000
                    } else if(y === 1 && x+z === 0) {
                        color = 0xFF00FF00
                    } else if(z === 1 && x+y === 0) {
                        color = 0xFF0000FF
                    }
                    let material = new MeshBasicMaterial({ color })
                    let mesh = new Mesh(geometry, material)
                    let mesh2 = new Mesh(geometry, material)
                    group.add(mesh)
                    group.add(mesh2)

                    this.points.push( { x, y, z, mesh } )
                    this.points2.push( { x, y, z, mesh:mesh2 } )
                }
            }
        }
        this.applycopypaste(root, studio.raytracer)
        this.applyMirrorCommand(root)
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
    
    applyMirrorCommand(root) {
        root.command('mirrorcube')
            .addCommandBuilder('mirror')
            .argument('axis', indexHandler('xyz'))
            .addCommandBuilder('mirrorx', 'x')
            .addCommandBuilder('mirrory', 'y')
            .addCommandBuilder('mirrorz', 'z')
            .onRun(args => {
                let rootCube = args.context.getCube()
                let axis = args.get('axis')

                let baseQuaternion = rootCube.tbl.modelCache.quaternion
                baseQuaternionInvese.copy(baseQuaternion).inverse()

                let worldPos = rootCube.cubeGroup.getWorldPosition(worldPosVector)
                let worldQuat = rootCube.cubeGroup.getWorldQuaternion(worldRotQuat)

                let normal = planeNormal.set(axis===0?1:0, axis===1?1:0, axis===2?1:0).normalize()//.applyQuaternion(worldQuat)

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
                rootCube.traverse(cube => {
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
                        rotationMatrix: rotationMatrix.toArray() 
                    })
                })

                rootCube.traverse(cube => {
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

                })

            })
    }
    
    onCommandExit() {
        if(this.commandResultChangeCache !== null) {
            this.commandResultChangeCache.cube.resetVisuals()
            this.commandResultChangeCache.cube.cubeGroup.updateMatrixWorld(true)
            this.commandResultChangeCache = null
            this.rotationPointMarkers.updateSpheres()
        }
    }

    onFrame() {
        if(this.commandResultChangeCache !== null) {
            this.commandResultChangeCache.func()
        }
    }
}


