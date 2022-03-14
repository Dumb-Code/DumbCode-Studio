import JSZip from "jszip";
import { DCMCube, DCMModel } from "./DcmModel";
import { loadDCMModel } from "./OldDCMLoader";

export const loadModelUnknown = async (arrayBuffer: ArrayBuffer | PromiseLike<ArrayBuffer>, name = "") => {
  try {
    return await loadModel(await arrayBuffer)
  } catch (e) {
    if (e instanceof ParseError) {
      console.warn(e)
      return await loadDCMModel(arrayBuffer, name)
    } else {
      throw e
    }
  }
}

export const loadModel = async (arrayBuffer: ArrayBuffer) => {

  const data = await getZippedFile<ParseModelType>(arrayBuffer, "dcm_model")

  const model = new DCMModel()
  model.undoRedoHandler.ignoreActions = true

  const cubeMapper = (cube: ParseCubeType): DCMCube => {
    return new DCMCube(cube.name,
      cube.dimension, cube.position, cube.offset,
      cube.rotation, cube.textureOffset, cube.textureMirrored,
      cube.cubeGrow, cube.children.map(c => cubeMapper(c)), model,
      cube.identifier
    )
  }

  model.author.value = data.author
  model.textureWidth.value = data.textureWidth
  model.textureHeight.value = data.textureHeight
  model.children.value = data.rootCubes.map(c => cubeMapper(c))

  model.undoRedoHandler.ignoreActions = false

  return model
}

export const writeModel = async (model: DCMModel) => {
  const cubeMapper = (cube: DCMCube): ParseCubeType => ({
    name: cube.name.value,
    dimension: cube.dimension.value, position: cube.position.value,
    offset: cube.offset.value, cubeGrow: cube.cubeGrow.value,
    rotation: cube.rotation.value,
    textureOffset: cube.textureOffset.value,
    textureMirrored: cube.textureMirrored.value,
    identifier: cube.identifier,
    children: cube.children.value.map(c => cubeMapper(c))
  })

  const data: ParseModelType = {
    version: 1,
    author: model.author.value,
    textureWidth: model.textureWidth.value,
    textureHeight: model.textureHeight.value,
    rootCubes: model.children.value.map(c => cubeMapper(c))
  }

  const stringData = JSON.stringify(data)

  const zip = new JSZip()
  zip.file("dcm_model", stringData)
  const blob = await zip.generateAsync({ type: "blob" })
  return blob
}

type TriVec = readonly [number, number, number]

type ParseModelType = {
  version: number,
  author: string,
  textureWidth: number,
  textureHeight: number,
  rootCubes: ParseCubeType[]
}

type ParseCubeType = {
  identifier: string,
  name: string,
  dimension: TriVec,
  position: TriVec,
  offset: TriVec,
  rotation: TriVec,
  cubeGrow: TriVec,
  textureOffset: readonly [number, number],
  textureMirrored: boolean,

  children: readonly ParseCubeType[]
}


export const getZippedFile = async <T>(arrayBuffer: ArrayBuffer, fileName: string) => {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(arrayBuffer)
  } catch (e) {
    throw new ParseError(`Unable to read zip ${e}`)
  }
  const file = zip.file(fileName)
  if (!file) {
    throw new ParseError(fileName + " was not defined")
  }

  let dataString: string;
  try {
    dataString = await file.async("string")
  } catch (e) {
    throw new ParseError(`Unable to read ${fileName}, ${e}`)
  }

  let data: T = JSON.parse(dataString)
  if (!data) {
    throw new ParseError("Unable to parse")
  }
  return data
}

export class ParseError extends Error { }
