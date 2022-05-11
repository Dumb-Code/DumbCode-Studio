import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { DCMCube } from '../../../formats/model/DcmModel';
import { LO } from "../../../util/ListenableObject";
import { AxisArgument, EnumArgument } from '../../Argument';
import { Command } from "../../Command";

const xyzAxis = "xyz"
const uvAxis = "uv"

const tempVec = new Vector3()
const tempQuat = new Quaternion()
const tempEuler = new Euler()

const decomposePosition = new Vector3()
const decomposeRotation = new Quaternion()
const decomposeEuler = new Euler()
const decomposeScale = new Vector3()

const resultMat = new Matrix4()
const resultMat2 = new Matrix4()

const ArrayCommands = (addCommand: (command: Command) => void) => {

  addCommand(createArrayCommand("pos", "position", c => c.position, xyzAxis, (c, v) => c.updatePositionVisuals(v), false, (mode, cube, axisValues) => {
    cube.parent.resetVisuals()

    if (!cube.cubeGroup.parent) {
      return
    }

    if (mode === "set") {
      cube.cubeGroup.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
      axisValues.forEach((e, idx) => e !== undefined && decomposePosition.setComponent(idx, (idx === 1 ? 0 : 0.5) + (e / 16)))
      resultMat.compose(decomposePosition, decomposeRotation, decomposeScale)

      resultMat2.copy(cube.cubeGroup.parent.matrixWorld).invert().multiply(resultMat)
      resultMat2.decompose(decomposePosition, decomposeRotation, decomposeScale)

      decomposePosition.toArray(axisValues)
    } else { //Add
      tempVec.fromArray(axisValues.map(e => e === undefined ? 0 : e))
      cube.cubeGroup.parent.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
      tempVec.applyQuaternion(decomposeRotation.inverse()).toArray(axisValues)
    }
  }))

  addCommand(createArrayCommand("rot", "rotation", c => c.position, xyzAxis, (c, v) => c.updateRotationVisuals(v), false, (mode, cube, axisValues) => {
    cube.parent.resetVisuals()

    if (!cube.cubeGroup.parent) {
      return
    }

    if (mode === "set") { //Set
      cube.cubeGroup.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
      tempVec.setFromEuler(decomposeEuler.setFromQuaternion(decomposeRotation, "ZYX"))
      axisValues.forEach((e, idx) => e === undefined ? null : tempVec.setComponent(idx, e * Math.PI / 180))
      resultMat.compose(decomposePosition, decomposeRotation.setFromEuler(decomposeEuler.setFromVector3(tempVec, "ZYX")), decomposeScale)

      resultMat2.copy(cube.cubeGroup.parent.matrixWorld).invert().multiply(resultMat)
      resultMat2.decompose(decomposePosition, decomposeRotation, decomposeScale)

      decomposeEuler.setFromQuaternion(decomposeRotation, "ZYX").toArray(axisValues)
      axisValues.forEach((v, idx) => axisValues[idx] = v * 180 / Math.PI) // :/
    } else { //Add
      let result = [0, 0, 0]
      for (let i = 0; i < 3; i++) {
        if (axisValues[i] === undefined) {
          continue
        }
        cube.cubeGroup.parent.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
        let axis = tempVec.set(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0).applyQuaternion(decomposeRotation.inverse())

        tempQuat.setFromAxisAngle(axis, axisValues[i] * Math.PI / 180)
        tempQuat.multiply(cube.cubeGroup.quaternion).normalize()

        tempEuler.setFromQuaternion(cube.cubeGroup.quaternion, "ZYX")
        decomposeEuler.setFromQuaternion(tempQuat, "ZYX")

        result[0] += (decomposeEuler.x - tempEuler.x) * 180 / Math.PI
        result[1] += (decomposeEuler.y - tempEuler.y) * 180 / Math.PI
        result[2] += (decomposeEuler.z - tempEuler.z) * 180 / Math.PI
      }


      result.forEach((e, idx) => axisValues[idx] = e)
    }
  }))

  addCommand(createArrayCommand("cg", "Cube Grow", cube => cube.cubeGrow, xyzAxis, (c, v) => c.updateCubeGrowVisuals({ value: v })))
  addCommand(createArrayCommand("dims", "Dimension", cube => cube.dimension, xyzAxis, (c, v) => c.updateGeometry({ dimension: v }), true))
  addCommand(createArrayCommand("off", "Offset", cube => cube.offset, xyzAxis, (c, v) => c.updateOffset(v)))


  addCommand(createArrayCommand("texoff", "Texture Offset", cube => cube.textureOffset, uvAxis, (c, v) => c.updateTexture({ textureOffset: v }), true))
}

const createArrayCommand = <T extends readonly number[],>(name: string, englishName: string, getter: (cube: DCMCube) => LO<T>, axis: string, preview: (cube: DCMCube, values: T) => void, integer = false, globalFunc?: (mode: "set" | "add", cube: DCMCube, axisValues: number[]) => void) => {
  return new Command(name, `Modify ${englishName}`, {
    mode: EnumArgument(`Whether to add or set the cubes ${englishName}.`, "set", "add"),
    axis: AxisArgument("The amount of which to change by.", axis, integer)
  }, context => {
    const mode = context.getArgument("mode")
    const axis = context.getArgument("axis")

    const cubes = context.getCubes()
    const onFrameValues = cubes.map(cube => {
      const lo = getter(cube)
      const valueMut = Array.from(lo.value)

      // @ts-expect-error -- We know that value will be of type T
      const value = valueMut as T
      if (mode === "set") {
        axis.forEach(a => valueMut[a.axis] = a.value)
      } else {
        axis.forEach(a => valueMut[a.axis] += a.value)
      }

      if (globalFunc && context.hasFlag("g")) {
        globalFunc(mode, cube, valueMut)
      }

      if (context.dummy) {
        return { cube, value }
      } else {
        lo.value = value
        return undefined
      }
    })

    context.logToConsole(`Changed the ${englishName} on ${cubes.length} cube${cubes.length === 1 ? "" : "s"}`)

    if (context.dummy) {
      return () => {
        onFrameValues.forEach(v => {
          if (!v) {
            return
          }
          const cube = v.cube;
          if (cube) {
            preview(cube, v.value)
          }
        })
      }
    }


  }, globalFunc ? { "g": "Move in global space" } : undefined)
    .addCommandBuilder(`set${name}`, { mode: "set" })
    .addCommandBuilder(`add${name}`, { mode: "add" })
}

export default ArrayCommands