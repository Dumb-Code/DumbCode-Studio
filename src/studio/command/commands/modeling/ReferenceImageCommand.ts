import { Command } from "../../Command";
import { _unsafe_OpenReferenceImage } from './../../../../dialogboxes/ReferenceImageDialogBox';

const ReferenceImageCommand = (addCommand: (command: Command) => void) => {
  addCommand(new Command(
    "refimg",
    "Opens up the reference image modal",
    {},
    context => {
      if (!context.dummy) {
        _unsafe_OpenReferenceImage()
      }
      return undefined
    }
  ))
}

export default ReferenceImageCommand