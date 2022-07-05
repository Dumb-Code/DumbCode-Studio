import JSZip from "jszip";
import { NumArray } from "../../util/NumArray";
import { DCMCube, DCMModel } from "./DcmModel";
import { loadDCMModel } from "./OldDCMLoader";
import { readTblFile } from "./TBLLoader";

export const loadModelUnknown = async (arrayBuffer: ArrayBuffer | PromiseLike<ArrayBuffer>, name = "") => {
  if (name.endsWith('.tbl')) {
    return readTblFile(await arrayBuffer)
  }

  try {
    return loadModel(await arrayBuffer)
  } catch (e) {
    if (e instanceof ParseError) {
      console.warn(e)
      return loadDCMModel(arrayBuffer, name)
    } else {
      throw e
    }
  }
}

const applyMetadata = (src: Record<string, string> | undefined, dst: Readonly<Record<string, string>>) => {
  if (src === undefined) {
    return
  }
  const dstModifiable = dst as Record<string, string>
  Object.assign(dstModifiable, src)
}

export const loadModel = async (arrayBuffer: ArrayBuffer) => {

  const data = await getZippedFile<ParseModelType>(arrayBuffer, "dcm_model")

  const model = new DCMModel()
  model.undoRedoHandler.ignoreActions = true

  const cubeMapper = (cube: ParseCubeType): DCMCube => {
    const dcm = new DCMCube(cube.name,
      cube.dimension, cube.position, cube.offset,
      cube.rotation, cube.textureOffset, cube.textureMirrored,
      cube.cubeGrow, cube.children.map(c => cubeMapper(c)), model,
      cube.identifier
    )

    applyMetadata(cube.metadata, dcm.metadata)

    return dcm
  }

  model.author.value = data.author
  model.textureWidth.value = data.textureWidth
  model.textureHeight.value = data.textureHeight
  model.children.value = data.rootCubes.map(c => cubeMapper(c))

  applyMetadata(data.metadata, model.metadata)

  model.undoRedoHandler.ignoreActions = false

  return model
}

//Copied from JSZIP
export interface OutputByType {
  base64: string;
  string: string;
  text: string;
  binarystring: string;
  array: number[];
  uint8array: Uint8Array;
  arraybuffer: ArrayBuffer;
  blob: Blob;
  nodebuffer: Buffer;
}

export const writeModel = async (model: DCMModel): Promise<Blob> => writeModelWithFormat(model, "blob")

export const writeModelWithFormat = async <T extends keyof OutputByType>(model: DCMModel, format?: T): Promise<OutputByType[T]> => {
  const cubeMapper = (cube: DCMCube): ParseCubeType => ({
    name: cube.name.value,
    dimension: cube.dimension.value, position: cube.position.value,
    offset: cube.offset.value, cubeGrow: cube.cubeGrow.value,
    rotation: cube.rotation.value,
    textureOffset: cube.textureOffset.value,
    textureMirrored: cube.textureMirrored.value,
    identifier: cube.identifier,
    children: cube.children.value.map(c => cubeMapper(c)),
    metadata: cube.metadata
  })

  const data: ParseModelType = {
    version: 1,
    author: model.author.value,
    textureWidth: model.textureWidth.value,
    textureHeight: model.textureHeight.value,
    rootCubes: model.children.value.map(c => cubeMapper(c)),
    metadata: model.metadata
  }

  const stringData = JSON.stringify(data)

  const zip = new JSZip()
  zip.file("dcm_model", stringData)
  const blob = await zip.generateAsync({ type: format })
  return blob
}

type ParseModelType = {
  version: number,
  author: string,
  textureWidth: number,
  textureHeight: number,
  rootCubes: ParseCubeType[],
  metadata?: Record<string, string>
}

type ParseCubeType = {
  identifier: string,
  name: string,
  dimension: NumArray,
  position: NumArray,
  offset: NumArray,
  rotation: NumArray,
  cubeGrow: NumArray,
  textureOffset: NumArray<2>,
  textureMirrored: boolean,
  children: readonly ParseCubeType[],
  metadata?: Record<string, string>
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
