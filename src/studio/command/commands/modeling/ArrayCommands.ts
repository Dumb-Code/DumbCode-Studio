import { DCMCube } from '../../../formats/model/DcmModel';
import { LO } from "../../../util/ListenableObject";
import { AxisArgument, EnumArgument } from '../../Argument';
import { Command } from "../../Command";

const xyzAxis = "xyz"
// const uvAxis = "uv"

const ArrayCommands = (addCommand: (command: Command) => void) => {
  addCommand(createArrayCommand("pos", "position", true, c => c.position, xyzAxis, (c, v) => c.updatePositionVisuals(v)))
  addCommand(createArrayCommand("rot", "rotation", true, c => c.position, xyzAxis, (c, v) => c.updateRotationVisuals(v)))
}

const createArrayCommand = <T extends readonly number[],>(name: string, englishName: string, canUseGlobal: boolean, getter: (cube: DCMCube) => LO<T>, axis: string, preview: (cube: DCMCube, values: T) => void, integer = false) => {
  return new Command(name, `Modify ${englishName}`, {
    mode: EnumArgument("set", "add"),
    axis: AxisArgument(axis, integer)
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


  }, canUseGlobal ? { "g": "Global" } : undefined)
    .addCommandBuilder(`set${name}`, { mode: "set" })
    .addCommandBuilder(`add${name}`, { mode: "add" })
}

export default ArrayCommands