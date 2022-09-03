import UnsafeOperations from "../../../util/UnsafeOperations";
import { Command } from "../../Command";

const ReferenceImageCommand = (addCommand: (command: Command) => void) => {
  addCommand(new Command(
    "refimg",
    "Opens up the reference image modal",
    {},
    context => {
      if (!context.dummy) {
        UnsafeOperations._unsafe_OpenReferenceImage()
      }
      return undefined
    }
  ))
}

export default ReferenceImageCommand