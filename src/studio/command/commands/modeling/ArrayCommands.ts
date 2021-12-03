import { DCMCube } from '../../../formats/model/DcmModel';
import { LO } from "../../../util/ListenableObject";
import { AxisArgument, EnumArgument } from '../../Argument';
import { Command } from "../../Command";

const xyzAxis = "xyz"
// const uvAxis = "uv"

const ArrayCommands = (addCommand: (command: Command) => void) => {
  addCommand(createArrayCommand("pos", "Position", c => c.position, xyzAxis))
  addCommand(createArrayCommand("rot", "Rotation", c => c.position, xyzAxis))
}

const createArrayCommand = <T,>(name: string, englishName: string, getter: (cube: DCMCube) => LO<T>, axis: string, integer = false) => {
  return new Command(name, `Modify ${name}`, {
    mode: EnumArgument("set", "add"),
    axis: AxisArgument(axis, integer)
  }, "axis")
    .addCommandBuilder(`set${name}`, { mode: "set" })
    .addCommandBuilder(`add${name}`, { mode: "add" })
}

export default ArrayCommands