import { Command } from "../../Command";

const CopyPasteCommand = (addCommand: (command: Command) => void) => {
  addCommand(new Command("copy", "Copy the selected objects", {}, context => {
    if (context.dummy) {
      return
    }
    context.getModel().copyCubes(context.hasFlag("c"))
    return undefined
  }, {
    c: "Copy the children of the selected objects too (recursively)"
  }))

  addCommand(new Command("paste", "Paste the cubes in the clipboard", {}, context => {
    if (context.dummy) {
      return
    }
    const model = context.getModel()
    const cubes = model.pasteCubes(context.hasFlag("w")) ?? []
    if (!context.hasFlag("m")) {
      model.startPaste()
      cubes.forEach(cube => {
        cube.parent.deleteChild(cube)
        model.addChild(cube)
      })
      model.finishPaste()
    }
    return undefined
  }, {
    w: "Paste the cubes with their world position. Otherwise, paste them with their local position",
    m: "Allow the paste to be manually adjusted"
  }))
}

export default CopyPasteCommand