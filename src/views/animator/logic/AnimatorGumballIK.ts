import { Bone3D, Chain3D, Structure3D, V3 } from "@aminere/fullik";
import { BoxGeometry, BufferAttribute, BufferGeometry, Euler, Group, Line, LineBasicMaterial, Mesh, MeshLambertMaterial, Object3D, Quaternion, Vector3 } from 'three';
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation";
import { DcaKeyframe } from './../../../studio/formats/animations/DcaAnimation';
import { CubeParent, DCMCube } from './../../../studio/formats/model/DcmModel';

const tempVec = new Vector3()
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

  readonly anchor = new Object3D()
  readonly helperGroup = new Group()

  readonly chainData: ChainData[] = []
  readonly visualHelpers: VisualHelpers[] = []

  readonly linePositionBuffer: BufferAttribute
  readonly lineHelper: Line

  constructor(group: Group, overlayGroup: Group) {
    this.anchor.rotation.order = "ZYX"
    group.add(this.anchor)

    overlayGroup.add(this.helperGroup)

    this.linePositionBuffer = new BufferAttribute(new Float32Array(32 * 3), 3)
    this.lineHelper = new Line(new BufferGeometry().setAttribute('position', this.linePositionBuffer), new LineBasicMaterial({ color: 0x528F15 }))
    this.helperGroup.add(this.lineHelper)
  }

  begin(cubes: readonly DCMCube[], anchorCubes: readonly string[]) {
    this.end() //todo: conditional - only call this if we need to 
    if (cubes.length !== 1) {
      return
    }
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

    this.lineHelper.geometry.setDrawRange(0, allCubes.length)
    this.lineHelper.visible = true

    let previousPosition: number[] | null = null
    let previousCube: DCMCube | null = null

    allCubes.reverse().forEach(cube => {
      const position = cube.getWorldPosition(0.5, 0.5, 0.5, tempVec)
      if (previousPosition !== null && previousCube !== null) {
        let start = new V3(previousPosition[0], previousPosition[1], previousPosition[2])
        let end = new V3(position.x, position.y, position.z)
        let bone = new Bone3D(start, end)

        this.chainData.push({
          cube: previousCube,
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
      this.solver.add(chain, this.anchor.position)
      this.solver.update()
      this.updateHelpers()
      selected.cubeGroup.getWorldQuaternion(this.startingWorldRot)
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
    if (cubes.length !== 1) {
      return
    }
    const selected = cubes[0]
    //We rely on some three.js element math stuff, so we need to make sure the model is animated correctly.
    //TODO: make sure this is actually true
    const model = animation.project.model
    model.resetVisuals()
    animation.animate(0)
    model.updateMatrixWorld(true)

    this.solver.update()
    this.updateHelpers()

    const changedData = this.chainData.map((data, i) => {
      const bone = this.solver.chains[0].bones[i] as Bone3D
      //Get the change in rotation that's been done.
      //This way we can preserve the starting rotation. 
      tempVec.set(bone.end.x - bone.start.x, bone.end.y - bone.start.y, bone.end.z - bone.start.z).normalize()
      tempQuat.setFromUnitVectors(data.offset, tempVec)
      //      parent_world * local = world
      //  =>  local = 'parent_world * world
      const element = data.cube.cubeGroup
      if (!element.parent) {
        console.error(`Cube ${data.cube.name.value} had no parent ?`)
        return null
      }
      const worldRotation = tempQuat.multiply(data.startingWorldRot)
      const quat = element.parent.getWorldQuaternion(worldQuat).invert().multiply(worldRotation)

      //Get the euler angles and set it to the rotation. Push these changes.
      const rot = data.cube.cubeGroup.rotation
      rot.setFromQuaternion(quat)

      data.cube.cubeGroup.updateMatrixWorld()

      return {
        rotations: [
          rot.x * 180 / Math.PI,
          rot.y * 180 / Math.PI,
          rot.z * 180 / Math.PI,
        ] as const,
        cube: data.cube
      }
    })

    const selectParent = selected.cubeGroup.parent
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
  }

  updateHelpers() {
    this.visualHelpers.forEach(({ cube, mesh }, index) => {
      cube.cubeGroup.getWorldQuaternion(mesh.quaternion)
      cube.getWorldPosition(0.5, 0.5, 0.5, mesh.position)

      this.linePositionBuffer.setXYZ(index, mesh.position.x, mesh.position.y, mesh.position.z)
    })
    this.linePositionBuffer.needsUpdate = true
  }



}