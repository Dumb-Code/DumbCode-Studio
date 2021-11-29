import { LO } from "../../util/ListenableObject";
import { EnumArgument } from '../Argument';
import { Command } from "../Command";
import { DCMCube } from './../../formats/model/DcmModel';
import { AxisArgument } from './../Argument';

const xyzAxis = "xyz"
const uvAxis = "uv"

const ArrayCommands = (addCommand: (command: Command<any, any, any>) => void) => {
  addCommand(createArrayCommand("pos", c => c.position, xyzAxis))
  addCommand(createArrayCommand("rot", c => c.position, xyzAxis))
}

const createArrayCommand = <T,>(name: string, getter: (cube: DCMCube) => LO<T>, axis: string, integer = false) => {
  return new Command(name, {
    "mode": EnumArgument("set", "add"),
    "axis": AxisArgument(axis, integer)
  }, "axis")
    .addCommandBuilder(`set${name}`, { "mode": "set" })
    .addCommandBuilder(`add${name}`, { "mode": "add" })
}

export default ArrayCommands