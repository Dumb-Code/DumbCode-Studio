import { TblCube } from "../tbl_loader.js"
import { axisNumberHandler, indexHandler } from "../command_handler.js"
import { CubeLocker } from "../util.js"
import { Vector3, Quaternion, Euler, Matrix4 } from "../three.js"

const baseQuaternionInvese = new Quaternion()
const worldPosVector = new Vector3()
const worldRotQuat = new Quaternion()
const planeNormal = new Vector3()
const tempMirrorVec = new Vector3()
const tempCubePos = new Vector3()
const tempCubeQuat = new Quaternion()
const tempCubeQuatForAxis = new Quaternion()
const tempCubeAxisStatic = new Vector3()
const tempCubeScale = new Vector3()
const tempCubeQuatAxis = new Vector3()
const tempCubeRotationPoint = new Vector3()
const tempCubeRotationPoint2 = new Vector3()
const tempResultMatrix = new Matrix4()
const tempCubeOffset = new Vector3()
const tempCubeDimensions = new Vector3()

export class CubeCommands {
    constructor(root, studio) {
        this.commandResultChangeCache = null

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

                let normal = planeNormal.set(axis===0?1:0, axis===1?1:0, axis===2?1:0).applyQuaternion(worldQuat).normalize()

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


                rootCube.traverse(cube => {
                    cube.cubeGroup.matrixWorld.decompose(tempCubePos, tempCubeQuat, tempCubeScale)
                    let newPosition = mirrorPoint(tempCubePos)
                    
            
                    //Get a random vector perpendicular to the axis and store in 2 places then rotate one of those variables by the cube's global rotation (tempCubeQuat)
                    //This will give the information to apply quaternion.setFromUnitVectors(vec1, vec2).
                    //If we then mirror those points and subtract the new position from before, we'll be able to see where those 2 points en up mirroring to.
                    //We'll then be able to then calculate the rotation quaternion.


                    //The reason I do the quaternion to axis angle, as we need a point that'll rotate the most, otherwise too much precision is lost and the end quatenion is off.
                    let movementAxis = this.quaternionToAxis(tempCubeQuatForAxis.copy(tempCubeQuat).premultiply(baseQuaternionInvese), tempCubeQuatAxis)
                    
                    //We need to find a random vector (v) different to `movementAxis` (from here called a)
                    do {
                        tempCubeAxisStatic.set(Math.random() * 10 + 1, Math.random() * 10 + 1, Math.random() * 10 + 1)
                    } while(movementAxis.distanceTo(tempCubeAxisStatic) < 0.01)
                    
                    //We then cross the random vector and the axis vector to get a vector perpendicular to the movement axis.
                    //The 50 is to allow for more precision
                    let perpendicular = tempCubeAxisStatic.cross(movementAxis).multiplyScalar(50)


                    let newRotation = tempCubeQuat
                    //If the perpendicular is length 0 there is no rotation
                    if(perpendicular.lengthSq() !== 0) {
                        let point1 = tempCubeRotationPoint.copy(perpendicular).applyQuaternion(baseQuaternion)
                        let point2 = tempCubeRotationPoint2.copy(perpendicular).applyQuaternion(tempCubeQuat)
    
                        let mirror1 = mirrorPoint(point1.add(tempCubePos)).sub(newPosition)
                        let mirror2 = mirrorPoint(point2.add(tempCubePos)).sub(newPosition)

                        //The reason I flip mirror1 and mirror2 around here is as quaternions work in reverse
                        newRotation.setFromUnitVectors(mirror2.normalize(), mirror1.normalize()).premultiply(baseQuaternionInvese)
                    }

                    CubeLocker.reconstructLocker(cube, 0, tempResultMatrix.compose(newPosition, newRotation, tempCubeScale))
                    

                    //Apply the offset:
                    cube.cubeMesh.matrixWorld.decompose(tempCubeOffset, tempCubeQuat, tempCubeScale)
                    let cubeOffset = mirrorPoint(tempCubeOffset)
        
                    // let mirroredOffset = cubeOffset.sub(newPosition).applyQuaternion(tempCubeQuat.premultiply(baseQuaternionInvese)).add(newPosition)
                    CubeLocker.reconstructLocker(cube, 1, tempResultMatrix.compose(cubeOffset, tempCubeQuat, tempCubeScale))

                    // let dimensions = tempCubeDimensions.fromArray(cube.dimensions).divideScalar(16).multiply(normal)
                    // dimensions.setComponent(axis, cube.dimensions[axis] / 16)

                    //localVector = worldVector * worldRotation


                    // cube.updateOffset()
                    // cube.cubeGroup.updateMatrixWorld(true)

                })

            })
    }

    quaternionToAxis(quat, axis) {
        if(quat.w > 1) {
            quat.normalize()
        }
        axis.set(quat.x, quat.y, quat.z)
        let s = Math.sqrt(1-quat.w*quat.w)
        if(s > 0.001) {
            axis.divideScalar(s)
        }
        return axis
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


