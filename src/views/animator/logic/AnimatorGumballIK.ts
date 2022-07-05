import { Bone3D, Chain3D, Structure3D, V3 } from "@aminere/fullik";
import { BoxGeometry, BufferAttribute, BufferGeometry, Euler, Group, Line, LineBasicMaterial, Mesh, MeshLambertMaterial, Object3D, Quaternion, Vector3 } from 'three';
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation";
import { DcaKeyframe } from './../../../studio/formats/animations/DcaAnimation';
import { CubeParent, DCMCube } from './../../../studio/formats/model/DcmModel';

const tempVec = new Vector3()
const tempVec2 = new Vector3()
const tempQuat = new Quaternion()
const worldQuat = new Quaternion()
const tempEuler = new Euler()
tempEuler.order = "ZYX"

const cubeHelperMesh = new Mesh(new BoxGeometry(1 / 32, 1 / 32, 1 / 32), new MeshLambertMaterial({ color: 0x528F15 }))

type ChainData = {
  cube: DCMCube,
  startingWorldRot: Quaternion,
  offset: Vector3
}

type VisualHelpers = {
  cube: DCMCube
  mesh: typeof cubeHelperMesh,
}

export class AnimatorGumballIK {
  readonly solver = new Structure3D()

  readonly startingWorldRot = new Quaternion()

  readonly startingPosOffset = new Vector3()
  readonly transformAnchor = new Vector3()

  readonly anchor = new Object3D()
  readonly helperGroup = new Group()

  readonly chainData: ChainData[] = []
  readonly visualHelpers: VisualHelpers[] = []

  readonly linePositionBuffer: BufferAttribute
  readonly lineHelper: Line

  private ikDirection: "move_cube_from_root" | "move_root_from_cube" = "move_cube_from_root"

  constructor(group: Group, overlayGroup: Group) {
    this.anchor.rotation.order = "ZYX"
    group.add(this.anchor)

    overlayGroup.add(this.helperGroup)

    this.linePositionBuffer = new BufferAttribute(new Float32Array(32 * 3), 3)
    this.lineHelper = new Line(new BufferGeometry().setAttribute('position', this.linePositionBuffer), new LineBasicMaterial({ color: 0x528F15 }))
    this.helperGroup.add(this.lineHelper)
  }

  begin(cubes: readonly DCMCube[], anchorCubes: readonly string[], direction: "upwards" | "downwards") {
    this.end() //todo: conditional - only call this if we need to 
    if (cubes.length !== 1) {
      return
    }
    this.ikDirection = direction === "upwards" ? "move_cube_from_root" : "move_root_from_cube"
    const selected = cubes[0]

    const chain = new Chain3D()
    //Get a list from the selected cube to either the root cube, or a cube marked as IK locked
    const allCubes: DCMCube[] = []
    for (let cube: CubeParent = selected; cube instanceof DCMCube; cube = cube.parent) {
      allCubes.push(cube)
      //Cube is ik locked
      if (anchorCubes.includes(cube.identifier)) {
        break
      }
    }

    if (this.ikDirection === "move_root_from_cube") {
      allCubes.reverse()
    }

    const firstCube = allCubes[0]

    firstCube.getWorldPosition(0.5, 0.5, 0.5, this.anchor.position)
    firstCube.cubeGroup.getWorldQuaternion(this.anchor.quaternion)

    this.lineHelper.geometry.setDrawRange(0, allCubes.length)
    this.lineHelper.visible = true

    let previousPosition: number[] | null = null
    let previousCube: DCMCube | null = null

    firstCube.cubeGroup.getWorldPosition(this.startingPosOffset).sub(firstCube.getWorldPosition(0.5, 0.5, 0.5, tempVec))

    allCubes.reverse().forEach(cube => {
      const position = cube.cubeGroup.getWorldPosition(tempVec)
      if (previousPosition !== null && previousCube !== null) {
        let start = new V3(previousPosition[0], previousPosition[1], previousPosition[2])
        let end = new V3(position.x, position.y, position.z)
        let bone = new Bone3D(start, end)

        this.chainData.push({
          cube: this.ikDirection === "move_cube_from_root" ? previousCube : cube,
          startingWorldRot: previousCube.cubeGroup.getWorldQuaternion(new Quaternion()),
          offset: new Vector3(end.x - start.x, end.y - start.y, end.z - start.z).normalize(),
        })
        chain.addBone(bone)
      }

      const mesh = cubeHelperMesh.clone()
      this.helperGroup.add(mesh)
      this.visualHelpers.push({ cube, mesh })

      previousPosition = position.toArray()
      previousCube = cube
    })

    if (allCubes.length !== 0) {
      this.transformAnchor.copy(this.anchor.position).add(this.startingPosOffset)
      this.solver.add(chain, this.transformAnchor)
      this.solver.update()
      this.updateHelpers()
      firstCube.cubeGroup.getWorldQuaternion(this.startingWorldRot)
    }
  }

  end() {
    this.solver.clear()
    this.chainData.length = 0
    this.visualHelpers.forEach(g => this.helperGroup.remove(g.mesh))
    this.visualHelpers.length = 0
    this.lineHelper.visible = false
  }

  objectChange(animation: DcaAnimation, keyframe: DcaKeyframe, cubes: readonly DCMCube[]) {
    if (cubes.length !== 1 || this.solver.chains[0] === undefined) {
      return
    }
    this.transformAnchor.copy(this.anchor.position).add(this.startingPosOffset)

    const selected = cubes[0]
    //We rely on some three.js element math stuff, so we need to make sure the model is animated correctly.
    //TODO: make sure this is actually true
    const model = animation.project.model
    model.resetVisuals()
    animation.animate(0)
    model.updateMatrixWorld(true)

    this.solver.update()
    this.updateHelpers()

    const arr = this.ikDirection === "move_root_from_cube" ? Array.from(this.chainData).reverse() : Array.from(this.chainData)
    const changedData = arr.map((data, iRaw) => {
      const i = this.ikDirection === "move_root_from_cube" ? arr.length - iRaw - 1 : iRaw
      const bone = this.solver.chains[0].bones[i] as Bone3D
      return AnimatorGumballIK.applyBoneToCube(bone, data)
    })


    if (this.ikDirection === "move_cube_from_root") {
      const selectParent = selected.cubeGroup.parent as any
      if (!selectParent) {
        throw new Error("Cube had no parent?");
      }
      //We need to have the selected cube have the same axis. So here it basically "inverts" the parent changes.
      selectParent.updateMatrixWorld()
      const quat = selectParent.getWorldQuaternion(worldQuat).invert().multiply(this.startingWorldRot)
      tempEuler.setFromQuaternion(quat)

      keyframe.wrapToSetValue(() => {
        keyframe.setRotationAbsoluteAnimated(selected,
          tempEuler.x * 180 / Math.PI,
          tempEuler.y * 180 / Math.PI,
          tempEuler.z * 180 / Math.PI,
        )
        changedData.forEach(data => data !== null && keyframe.setRotationAbsoluteAnimated(data.cube, ...data.rotations))
      })
    } else {
      keyframe.wrapToSetValue(() => {
        const last = this.chainData.length - 1
        const bone = this.solver.chains[0].bones[last] as Bone3D
        const data = this.chainData[last]

        const targetWorldPos = bone.end
        const currentWorldPos = data.cube.cubeGroup.getWorldPosition(tempVec)
        const worldChange = tempVec2.set(targetWorldPos.x - currentWorldPos.x, targetWorldPos.y - currentWorldPos.y, targetWorldPos.z - currentWorldPos.z)

        data.cube.cubeGroup.getWorldQuaternion(worldQuat)
        worldQuat.invert()
        const localChange = worldChange.applyQuaternion(worldQuat).multiplyScalar(16)

        const localAbsolutePosition = localChange.add(data.cube.cubeGroup.position)
        keyframe.setPositionAbsoluteAnimated(data.cube, localAbsolutePosition.x, localAbsolutePosition.y, localAbsolutePosition.z)

        changedData.forEach(data => data !== null && keyframe.setRotationAbsoluteAnimated(data.cube, ...data.rotations))
      })
    }
  }

  static applyBoneToCube(bone: Bone3D, data: { offset: Vector3, cube: DCMCube, startingWorldRot: Quaternion }) {
    //Get the change in rotation that's been done.
    //This way we can preserve the starting rotation. 
    tempVec.set(bone.end.x - bone.start.x, bone.end.y - bone.start.y, bone.end.z - bone.start.z).normalize()
    tempQuat.setFromUnitVectors(data.offset, tempVec)

    const element = data.cube.cubeGroup
    if (!element.parent) {
      console.error(`Cube ${data.cube.name.value} had no parent ?`)
      return null
    }

    //      parent_world * local = world
    //  =>  local = 'parent_world * world
    const parentInverseMatrix = element.parent.getWorldQuaternion(worldQuat).invert()
    const worldMatrix = tempQuat.multiply(data.startingWorldRot)

    const quat = parentInverseMatrix.multiply(worldMatrix)

    // const worldRotation = tempQuat.premultiply(data.startingWorldRot)
    // const quat = element.parent.getWorldQuaternion(worldQuat).invert().multiply(worldRotation)

    //TODO:
    //Problem currently is that IK only works when theres no change before it
    //If there's a change before it, then it essentially ignores them. FIgure out why this is.
    //Look at the varibles here, and look what changes between having and not having a keyframe before
    //the current. I am sleep
    //Might be due to the fact we use the world matrix ?

    //Get the euler angles and set it to the rotation. Push these changes.
    // const rot = data.cube.cubeGroup.rotation
    // rot.setFromQuaternion(quat)
    // data.cube.cubeGroup.setRotationFromQuaternion(quat)
    const rot = data.cube.cubeGroup.rotation
    rot.setFromQuaternion(quat)
    data.cube.cubeGroup.updateMatrixWorld(true)

    return {
      rotations: [
        rot.x * 180 / Math.PI,
        rot.y * 180 / Math.PI,
        rot.z * 180 / Math.PI,
      ] as const,
      cube: data.cube
    }
  }

  updateHelpers() {
    //Update the helpers based on the solver
    const chain = this.solver.chains[0]
    if (chain === undefined) {
      return
    }
    const bones = this.solver.chains[0].bones as Bone3D[]
    if (bones === null) {
      return
    }

    bones.forEach((bone, index) => {
      if (index === 0) {
        this.visualHelpers[0].mesh.position.set(bone.start.x, bone.start.y, bone.start.z)
        this.linePositionBuffer.setXYZ(0, bone.start.x, bone.start.y, bone.start.z)
      }
      this.visualHelpers[index + 1].mesh.position.set(bone.end.x, bone.end.y, bone.end.z)
      this.linePositionBuffer.setXYZ(index + 1, bone.end.x, bone.end.y, bone.end.z)
    })
    this.linePositionBuffer.needsUpdate = true

    //Update the helpers based on the cubes
    // this.visualHelpers.forEach(({ cube, mesh }, index) => {
    //   cube.cubeGroup.getWorldQuaternion(mesh.quaternion)
    //   cube.getWorldPosition(0.5, 0.5, 0.5, mesh.position)

    //   this.linePositionBuffer.setXYZ(index, mesh.position.x, mesh.position.y, mesh.position.z)
    // })
    // this.linePositionBuffer.needsUpdate = true
  }



}