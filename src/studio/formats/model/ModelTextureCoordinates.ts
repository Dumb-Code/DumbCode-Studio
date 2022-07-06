import UndoRedoHandler, { SectionHandle } from "../../undoredo/UndoRedoHandler";
import { LO } from "../../util/ListenableObject";
import { NumArray } from "../../util/NumArray";
import { DCMModel } from "./DcmModel";

type TextureMapperUndoRedoType = {
  section_name: "root_data",
  data: {
    textureWidth: number,
    textureHeight: number,
  }
} | {
  section_name: `cube_${string}`
  data: {
    identifier: string, //Unchanging
    textureOffset: NumArray<2>,
    textureMirrored: boolean,
  }
}


export class ModelTextureCoordinates {



  readonly undoRedoHandler = new UndoRedoHandler<TextureMapperUndoRedoType>(
    (s, d) => this.onAddSection(s, d),
    s => this.onRemoveSection(s),
    (s, p, v) => this.onModifySection(s, p, v),
  )

  readonly _section = this.undoRedoHandler.createNewSection("root_data")

  readonly cubeIdentifToCoords = new Map<string, CubeTextureCoordinates>()

  readonly textureWidth = new LO(64).applyToSection(this._section, "textureWidth")
  readonly textureHeight = new LO(32).applyToSection(this._section, "textureHeight")

  constructor(
    readonly model: DCMModel
  ) { }

  setCoordinates(cubeIdentifer: string, coords: NumArray<2>, mirrored: boolean) {
    this.cubeIdentifToCoords.set(cubeIdentifer, new CubeTextureCoordinates(cubeIdentifer, this, coords, mirrored))
  }

  //Get the coordinates, and create a new one if it doesn't exist
  getCoordinates(cubeIdentifer: string): CubeTextureCoordinates {
    const coords = this.cubeIdentifToCoords.get(cubeIdentifer)
    if (coords) {
      return coords
    }
    this.setCoordinates(cubeIdentifer, [0, 0], false)
    return this.cubeIdentifToCoords.get(cubeIdentifer)!
  }


  onAddSection<K extends TextureMapperUndoRedoType['section_name']>(section: K, data: any) {
    if (section === "root_data") {
      return
    }
    const { identifier, textureMirrored, textureOffset } = data as (TextureMapperUndoRedoType & { section_name: `cube_${string}` })['data']
    this.cubeIdentifToCoords.set(identifier, new CubeTextureCoordinates(identifier, this, textureOffset, textureMirrored))

  }

  onRemoveSection(section: string) {
    if (section === "root_data") {
      return
    }
    const identif = section.substring("cube_".length, section.length)
    this.cubeIdentifToCoords.delete(identif)
  }

  onModifySection(section_name: string, property_name: string, value: any) {
    if (section_name === "root_data") {
      this._section.applyModification(property_name, value)
    } else {
      const identif = section_name.substring("cube_".length, section_name.length)
      const cube = this.cubeIdentifToCoords.get(identif)
      if (!cube) {
        throw new Error("Tried to modify a cube that could not be found " + identif);
      }
      cube._section?.applyModification(property_name, value)
    }
  }

}
type CubeSectionType = SectionHandle<TextureMapperUndoRedoType, TextureMapperUndoRedoType & { section_name: `cube_${string}` }>
class CubeTextureCoordinates {
  readonly _section: CubeSectionType
  readonly coords: LO<NumArray<2>>
  readonly mirrored: LO<boolean>

  constructor(
    readonly identifier: string,
    modelCoords: ModelTextureCoordinates,
    coords: NumArray<2>,
    mirrored: boolean,
  ) {
    this._section = modelCoords.undoRedoHandler.createNewSection(`cube_${this.identifier}`, "Cube Texture Edit") as CubeSectionType

    this.coords = new LO(coords).applyToSection(this._section, "textureOffset")
    this.mirrored = new LO(mirrored).applyToSection(this._section, "textureMirrored")

    this._section.pushCreation("Cube Texture Coords Creation")

    const onDirty = () => modelCoords.model.needsSaving.value = true
    this.coords.addListener(onDirty)
    this.mirrored.addListener(onDirty)
  }
}