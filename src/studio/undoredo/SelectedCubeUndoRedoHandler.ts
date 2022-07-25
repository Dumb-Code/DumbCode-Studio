import { LO } from "../util/ListenableObject"
import UndoRedoHandler, { SectionHandle, UndoRedoSection } from "./UndoRedoHandler"

type SelectedCubeItem = {
  section_name: "selected_cubes",
  data: {
    selected_cubes: string[]
  }
}
type SelectedCubesSectionType = SectionHandle<any, SelectedCubeItem>


export default class SelectedCubeUndoRedoHandler<S extends UndoRedoSection> extends UndoRedoHandler<S> {

  readonly _section = this.createNewSection("selected_cubes") as SelectedCubesSectionType
  readonly selectedCubes = new LO<readonly string[]>([]).applyToSection(this._section, "selected_cubes")

  constructor(
    addSectionCallback: <K extends S['section_name'], Sec extends S & { section_name: K }> (section_name: K, data: Sec['data']) => void,
    removeSectionCallback: (section_name: string) => void,
    modifySectionCallback: (section_name: string, property_name: string, value: any) => void
  ) {
    super(
      (name, data) => {
        if (name === "selected_cubes") {
          throw new Error("Tried to add root section");
        } else {
          addSectionCallback(name, data)
        }
      },
      (name) => {
        if (name === "selected_cubes") {
          throw new Error("Tried to remove root section");
        } else {
          removeSectionCallback(name)
        }
      },
      (section_name, property_name, value) => {
        if (section_name === "selected_cubes") {
          this._section.applyModification(property_name, value)
        } else {
          modifySectionCallback(section_name, property_name, value)
        }
      }
    )
  }

}