import JSZip from "jszip";
import { createReadableFileExtended, WritableFile } from "../../files/FileTypes";
import { SerializedUndoRedoHandler } from "../../undoredo/UndoRedoHandler";
import { ReferenceImage } from "../../util/ReferenceImageHandler";
import { imgSourceToElement, writeImgToBlob } from "../../util/Utils";
import { loadUnknownAnimation, writeDCAAnimation } from "../animations/DCALoader";
import { loadModelUnknown, writeModel } from "../model/DCMLoader";
import { DCMCube } from "../model/DcmModel";
import { TextureGroup } from "../textures/TextureManager";
import { NumArray } from './../../util/NumArray';
import { KeyframeLayerData } from './../animations/DcaAnimation';
import DcProject from "./DcProject";

let keepFilesNice = false
let dumbcodeHiddenFolder_read: ReadableFolder | null = null
let dumbcodeHiddenFolder_write: WriteableFolder | null = null


type ModelDataJson = {
  projectHistory: SerializedUndoRedoHandler,
  modelHistory: SerializedUndoRedoHandler
}

interface TypeByName {
  text: string;
  arraybuffer: ArrayBuffer;
  blob: Blob;
}

type ReadableFolder = {
  file: (name: string) => OrPromise<ReadableFile | null>
  folder: (name: string) => OrPromise<ReadableFolder | null>
  name: string
}

type ReadableFile = {
  async: <T extends keyof TypeByName, >(type: T) => Promise<TypeByName[T]>
  asHandle?: () => FileSystemFileHandle
}

type WriteableFolder = {
  file: (name: string, content: OrPromise<Blob | string>) => OrPromise<void>
  folder: (name: string) => OrPromise<WriteableFolder>
  name: string
}

type OrPromise<T> = T | Promise<T>

const createReadableFile = (handle: FileSystemFileHandle): ReadableFile => {
  return {
    async: async<T extends keyof TypeByName, R = TypeByName[T]>(type: T): Promise<R> => {
      const file = await handle.getFile()
      if (type === "arraybuffer") {
        return (await file.arrayBuffer()) as any as R
      }
      if (type === "blob") {
        return file as any as R
      }
      if (type === "text") {
        return (await file.text()) as any as R
      }
      throw new Error(`Unknown file type ${type}`)
    },
    asHandle: () => handle
  }
}

const createReadableFolder = (handle: FileSystemDirectoryHandle, name = "_root"): ReadableFolder => {
  return {
    file: async (name: string) => {
      try {
        return createReadableFile(await handle.getFileHandle(name))
      } catch (e) {
        return null
      }
    },
    folder: async (name: string) => {
      try {
        return createReadableFolder(await handle.getDirectoryHandle(name), name)
      } catch (e) {
        return null
      }
    },
    name,
  }
}

const createWriteableFolder = (handle: FileSystemDirectoryHandle, name = "_root"): WriteableFolder => {
  return {
    file: async (name, content) => {
      const file = await handle.getFileHandle(name, { create: true })
      const writeable = await file.createWritable()
      await writeable.write(await content)
      await writeable.close()
    },
    folder: async (name: string) => {
      const folder = await handle.getDirectoryHandle(name, { create: true })
      return createWriteableFolder(folder, folder.name)
    },
    name: name,
  }
}

const wrapZipReadable = (zip: JSZip, name = "_root"): ReadableFolder => {
  return {
    file: (name: string) => zip.file(name),
    folder: (name: string) => {
      const folder = zip.folder(name)
      if (folder === null) {
        return null
      }
      return wrapZipReadable(folder, name)
    },
    name: name
  }
}

export const loadDcProj = async (name: string, buffer: ArrayBuffer, writeable: WritableFile) => {
  const zip = await JSZip.loadAsync(buffer)
  const project = await loadFolderProject(name, zip, false)

  project.projectWritableFile = writeable
  project.projectSaveType.value = "project"

  return project
}

export const loadDcFolder = async (folder: FileSystemDirectoryHandle) => {
  return loadFolderProject(folder.name, createReadableFolder(folder), true)
}

export const loadFolderProject = async (name: string, zip: ReadableFolder, shouldKeepFilesNice: boolean) => {
  keepFilesNice = shouldKeepFilesNice
  if (shouldKeepFilesNice) {
    dumbcodeHiddenFolder_read = await zip.folder(".dumbcode")
  }
  const model = await loadDcProjModel(zip)
  const project = new DcProject(name, model)

  const awaiters: Promise<void>[] = []

  awaiters.push(loadProjectData((await getDataRootFolderReadable(zip)).file("data.json"), project))
  awaiters.push(loadTextures(zip.folder("textures"), project))
  awaiters.push(loadAnimations(zip.folder("animations"), project))
  awaiters.push(loadRefImages(zip.folder("ref_images"), project))


  await Promise.all(awaiters)

  dumbcodeHiddenFolder_read = null

  return project
}

const loadDcProjModel = async (zip: ReadableFolder) => loadModelUnknown((await file(zip, 'model.dcm')).async('arraybuffer'))

const loadProjectData = async (fileP: OrPromise<ReadableFile | null>, project: DcProject) => {
  const file = await fileP
  if (file === null) {
    return
  }
  const json = JSON.parse(await file.async("text")) as ModelDataJson
  project.undoRedoHandler.loadFromJson(json.projectHistory)
  project.model.undoRedoHandler.loadFromJson(json.modelHistory)
}

//Load the animation data. The old structure was as follows:
//
//animations           ┌───────────────────────┐
// ├─ animation_name ──┤ walking_animation     │ (will be used for 0.dca/0.json)
// ├─ 0.dca            │ Some Second Aniamtion │ (will be used for 1.dca/1.json)
// ├─ 0.json           │ WorldsBestAnimation   │ (will be used for 2.dca/2.json)
// ├─ 1.dca            └───────────────────────┘
// ├─ 1.json
// ├─ 2.dca
// └─ 2.json
//
//The .json part of each entry holds the metadata for the animation.
//Currently, this handles keyframeInfo and (newly) ikaCubes
//Note in the future this could be extended to include the name, so
//animation_names doesn't have to exist.
//
//Now, its:
//animations         
// ├─ data.json* 
// ├─ 0.dca        
// ├─ 1.dca        
// └─ 2.dca
//
// *data.json is of the following format:
// {
//   animations: [{
//     name: string,
//     ikAnchorCubes: string[] -- cube identifiers
//     layers: [{
//       id: number,
//       name: string,
//       visible: boolean,
//       locked: boolean,
//       definedMode: boolean
//     }]
//   }]
// }
//Note that in folder saving, the `animation_name` file is used, but called `file_indexes`

type KeyframeLayerDataJson = {
  id: number,
  name: string,
  visible: boolean,
  locked: boolean,
  definedMode: boolean
}

type AnimationData = {
  animations: {
    name: string,
    ikAnchorCubes: string[]
    layers: KeyframeLayerDataJson[]
    history?: SerializedUndoRedoHandler,
  }[]
}

type LegacyAnimationData = {
  ikaCubes: string[] //This is cube NAMES, we need to convert this to cube IDENTIFIERS
  keyframeInfo: KeyframeLayerDataJson[]
}

const loadAnimations = async (folderP: OrPromise<ReadableFolder | null>, project: DcProject) => {
  const folder = await folderP
  if (folder === null) {
    return
  }
  const [animations, animationData] = await Promise.all([
    loadDcaAnimations(folder, project),
    loadAnimationData(folder)
  ])

  animations.forEach((animation, index) => {
    const data = animationData.animations[index]
    animation.name.value = data.name


    //Convert ik anchor from cube names to identifiers.
    animation.ikAnchorCubes.value = data.ikAnchorCubes.map(cubeName => {
      const set = project.model.cubeMap.get(cubeName)
      if (set === undefined) {
        return null
      }
      return Array.from(set)
    })
      .filter((set): set is DCMCube[] => set !== null)
      .flatMap(cubes => cubes.map(cube => cube.name.value))

    animation.keyframeLayers.value = data.layers.map(layer => new KeyframeLayerData(animation, layer.id, layer.name, layer.visible, layer.locked, layer.definedMode))

    if (data.history !== undefined) {
      animation.undoRedoHandler.loadFromJson(data.history)
    }
    project.animationTabs.addAnimation(animation)
  })


}

const loadAnimationData = async (folder: ReadableFolder): Promise<AnimationData> => {
  const dataFolder = await getDataRootFolderReadable(folder)
  const dataFile = await dataFolder.file("data.json")
  if (dataFile === null) {
    return loadLegacyAnimationData(folder)
  }
  return dataFile.async("text").then(file => JSON.parse(file) as AnimationData)
}

const loadLegacyAnimationData = async (folder: ReadableFolder): Promise<AnimationData> => {
  const [animationNames, dataFiles] = await Promise.all([
    (await file(folder, "animation_names")).async("text").then(s => s.split("\n")),
    Promise.all((await getFileArray(folder, "json"))
      .map(async (file) => file.async("text").then(file => JSON.parse(file) as LegacyAnimationData))
    )
  ])

  return {
    animations: animationNames.map((name, index) => ({
      name,
      ikAnchorCubes: dataFiles[index].ikaCubes,
      layers: dataFiles[index].keyframeInfo,
    }))
  }
}


const loadDcaAnimations = async (folder: ReadableFolder, project: DcProject) => {
  return Promise.all((await getFileArray(folder, "dca"))
    .map(async (file, index) => file.async("arraybuffer").then(arrayBuffer => loadUnknownAnimation(project, `Dc_ProjAnim_${index}`, arrayBuffer)))
  )
}

//Load the texture data. The old structure was as follows:
//
//textures             ┌───────────────────────┐
// ├─ groups.json*     │ MyFirstLayer.png      │ (will be used for 0.png)
// ├─ texture_names ───┤ Some Second Layer.png │ (will be used for 1.png)
// ├─ 0.png            │ TheThirdLayer.png     │ (will be used for 2.png)
// ├─ 1.png            └───────────────────────┘
// └─ 2.png
//
// *groups.json holds an array of elements of the following format:
// {
//   name -> a string of the group name
//   layerIDs -> a list of integers pertaining to the layer texture indexes.
// }
//
//Now, it's:
//textures         
// ├─ data.json* 
// ├─ 0.png        
// ├─ 1.png        
// └─ 2.png
//
// *data.json is of the following format:
// {
//   texture_names: [string],
//   groups: [{
//     name: string,
//     layerIDs: [number]
//   }]
// }

type TextureData = { texture_names: string[], groups: TextureGroupData[], textures_need_flipping?: boolean }
type TextureGroupData = { name: string, layerIDs: number[], isDefault?: boolean }

const loadTextures = async (folderP: OrPromise<ReadableFolder | null>, project: DcProject) => {
  const folder = await folderP
  if (folder === null) {
    return
  }
  const [imgs, datas] = await Promise.all([
    getTexturesArray(folder),
    getTexturesData(folder)
  ])

  const textures = imgs.map(({ img, handle }, index) => {
    const texture = project.textureManager.addTexture(datas.texture_names[index], img)
    if (handle !== undefined) {
      project.textureManager.linkFile(createReadableFileExtended(handle), texture)
    }
    return texture
  })

  //For some reason, the legacy code reverses the array list here?
  if (datas.textures_need_flipping === true) {
    textures.reverse()
  }

  datas.groups.forEach(groupData => {
    const group = new TextureGroup(groupData.name, groupData.isDefault ?? false);
    groupData.layerIDs.forEach(id => group.toggleTexture(textures[id], true))
    project.textureManager.addGroup(group)
  })
}

const getTexturesArray = async (folder: ReadableFolder) => {
  return Promise.all((await getFileArray(folder, "png"))
    .map(async (file) => ({
      img: await file.async('blob').then(texture => imgSourceToElement(URL.createObjectURL(texture))),
      handle: file.asHandle?.()
    }))
  )
}

const getTexturesData = async (folder: ReadableFolder): Promise<TextureData> => {
  const dataFolder = await getDataRootFolderReadable(folder)
  const dataFile = await dataFolder.file("data.json")
  if (dataFile === null) {
    return getLegacyTexturesData(folder)
  }
  const data = await dataFile.async('text').then(g => JSON.parse(g) as TextureData)
  return {
    ...data,
    textures_need_flipping: false
  }
}

const getLegacyTexturesData = async (folder: ReadableFolder): Promise<TextureData> => {
  const [groups, textureNames] = await Promise.all([
    (await file(folder, "groups.json")).async('text').then(g => JSON.parse(g) as TextureGroupData[]),
    (await file(folder, "texture_names")).async('text').then(s => s.split("\n"))
  ])
  return {
    texture_names: textureNames,
    groups,
    textures_need_flipping: true,
  }
}


//Load the reference image data. Old Format is:
//ref_images        
// ├─ data.json
// ├─ MyFirstReferenceImage.png
// └─ MostIncredibleSideProfile.png
//data.json is a json list of the type `LegacyRefImgData` (See below)
//
//New format is:
//ref_images        
// ├─ data.json
// ├─ 0.png
// └─ 1.png
//data.json is of the type `RefImgData` (See below)

type LegacyRefImgData = {
  name: string,
  pos: NumArray,
  rot: NumArray,
  scale: number | NumArray,
  opacity: number,
  canSelect: boolean,

  //New values:
  hidden?: boolean,
  flipX: boolean,
  flipY: boolean,
}[]

type RefImgData = {
  new_format: boolean, //False on old versions, true on new versions
  entries: LegacyRefImgData
}
const loadRefImages = async (folderP: OrPromise<ReadableFolder | null>, project: DcProject) => {
  const folder = await folderP
  if (folder === null) {
    return
  }
  const data = await getRefImagesData(folder)
  const images = await getRefImages(folder, data.new_format ? null : data.entries.map(e => e.name))

  project.referenceImageHandler.images.value = images.map((img, i) => {
    const d: LegacyRefImgData[number] = data.entries[i];

    const scale = Array.isArray(d.scale) ? d.scale[2] : d.scale
    const flipX = Array.isArray(d.scale) ? d.scale[0] !== d.scale[2] : d.flipX
    const flipY = Array.isArray(d.scale) ? d.scale[1] !== d.scale[2] : d.flipY

    return new ReferenceImage(
      project.referenceImageHandler, img, d.name,
      d.opacity, d.canSelect, d.hidden ?? false,
      d.pos, d.rot, scale, flipX, flipY
    )
  })
}

const getRefImagesData = async (folder: ReadableFolder): Promise<RefImgData> => {
  const dataFolder = await getDataRootFolderReadable(folder)
  const f = await file(dataFolder, "data.json")
  const dataFile = await f.async('text').then(g => JSON.parse(g) as RefImgData | LegacyRefImgData)
  if (Array.isArray(dataFile)) {
    return {
      new_format: false,
      entries: dataFile
    }
  }
  return {
    ...dataFile,
    new_format: true
  }
}

const getRefImages = async (folder: ReadableFolder, legacyImgNames: string[] | null): Promise<HTMLImageElement[]> => {
  return Promise.all((await getFileArrayIndex(folder, "png", legacyImgNames ?? undefined))
    .map(async (file) => file.async('blob').then(texture => imgSourceToElement(URL.createObjectURL(texture))))
  )
}

// --- EXPORTER

const wrapZip = (zip: JSZip, name = "_root"): WriteableFolder => {
  return {
    file: (name, content) => { zip.file(name, content) },
    folder: (name) => wrapZip(zip.folder(name)!, name),
    name: name
  }
}

export const writeDcProj = async (project: DcProject): Promise<Blob> => {
  const zip = new JSZip()
  writeFolderProject(project, wrapZip(zip), false)
  return zip.generateAsync({ type: "blob" })
}

export const writeDcFolder = async (project: DcProject, folder: FileSystemDirectoryHandle) => {
  await writeFolderProject(project, createWriteableFolder(folder), true)
}

const writeFolderProject = async (projet: DcProject, folder: WriteableFolder, shouldKeepFilesNice: boolean) => {
  keepFilesNice = shouldKeepFilesNice
  if (shouldKeepFilesNice) {
    dumbcodeHiddenFolder_write = await folder.folder(".dumbcode")
  }
  await Promise.all([
    folder.file("model.dcm", writeModel(projet.model)),
    writeProjectData(projet, folder),
    writeAnimations(projet, folder.folder("animations")),
    writeTextures(projet, folder.folder("textures")),
    writeRefImages(projet, folder.folder("ref_images")),
  ])
  dumbcodeHiddenFolder_write = null

}

const writeProjectData = async (project: DcProject, folder: WriteableFolder) => {
  const data: ModelDataJson = {
    modelHistory: project.model.undoRedoHandler.jsonRepresentation(),
    projectHistory: project.undoRedoHandler.jsonRepresentation()
  }
  const dataFolder = await getDataRootFolderWriteable(folder)
  await dataFolder.file("data.json", JSON.stringify(data))
}

const writeAnimations = async (project: DcProject, folderP: OrPromise<WriteableFolder>) => {
  const folder = await folderP
  const animationData: AnimationData = {
    animations: project.animationTabs.animations.value.map(anim => ({
      name: anim.name.value,
      ikAnchorCubes: [...anim.ikAnchorCubes.value],
      layers: anim.keyframeLayers.value.map(layer => ({
        id: layer.layerId,
        name: layer.name.value,
        locked: layer.locked.value,
        visible: layer.visible.value,
        definedMode: layer.definedMode.value,
      })),
      history: anim.undoRedoHandler.jsonRepresentation()
    }))
  }

  const dataFolder = await getDataRootFolderWriteable(folder)

  await Promise.all([
    dataFolder.file("data.json", JSON.stringify(animationData)),

    ...project.animationTabs.animations.value.map((anim, index) =>
      folder.file(`${keepFilesNice ? anim.name.value : index}.dca`, writeDCAAnimation(anim))
    ),
    writeNameIndexFileIfNeeded(folder, project.animationTabs.animations.value.map(a => a.name.value))
  ])

}

const writeTextures = async (project: DcProject, folderP: OrPromise<WriteableFolder>) => {
  const folder = await folderP
  const textures = project.textureManager.textures.value
  const textureData: TextureData = {
    texture_names: textures.map(t => t.name.value),
    groups: project.textureManager.groups.value.map(group => ({
      isDefault: group.isDefault,
      name: group.name.value,
      layerIDs: group.textures.value.map(identifier => textures.findIndex(texture => texture.identifier === identifier)).filter(id => id !== -1)
    }))
  }

  const dataFolder = await getDataRootFolderWriteable(folder)

  await Promise.all([
    dataFolder.file("data.json", JSON.stringify(textureData)),
    ...textures.map((texture, index) => writeImg(folder, keepFilesNice ? texture.name.value : index, texture.element.value)),
    writeNameIndexFileIfNeeded(folder, textures.map(t => t.name.value))
  ])
}

const writeRefImages = async (project: DcProject, folderP: OrPromise<WriteableFolder>) => {
  const folder = await folderP
  const images = project.referenceImageHandler.images.value
  const refImgData: RefImgData = {
    new_format: true,
    entries: images.map((imgs, index) => ({
      name: imgs.name.value,
      opacity: imgs.opacity.value,
      canSelect: imgs.canSelect.value,
      flipX: imgs.flipX.value,
      flipY: imgs.flipY.value,
      pos: [...imgs.position.value],
      rot: [...imgs.rotation.value],
      scale: imgs.scale.value,
      hidden: imgs.hidden.value
    }))
  }

  const dataFolder = await getDataRootFolderWriteable(folder)

  await Promise.all([
    dataFolder.file("data.json", JSON.stringify(refImgData)),
    ...images.map((image, index) => writeImg(folder, keepFilesNice ? image.name.value : index, image.img)),
    writeNameIndexFileIfNeeded(folder, images.map(t => t.name.value))
  ])
}

// --- Utils

const getFileArray = (folder: ReadableFolder, extension: string) => getFileArrayIndex(folder, extension)

const getFileArrayIndex = async (folder: ReadableFolder, extension: string, nameOverrides?: string[]) => {
  const files: ReadableFile[] = []

  const names = nameOverrides ?? await getNameIndexFileIfNeeded(folder)
  const applier = (index: number) => `${names[index] ?? index}.${extension}`

  for (let index = 0, file: OrPromise<ReadableFile | null> = null; (file = await folder.file(applier(index))) !== null; index++) {
    files.push(file)
  }

  console.log(files, applier(files.length), folder.name)

  return files
}

const file = async (zip: ReadableFolder, fileName: string) => {
  const file = await zip.file(fileName)
  if (file === null) {
    throw new Error(`Unable to find the file '${fileName}'.`)
  }
  return file
}

const folder = async (zip: ReadableFolder, fileName: string) => {
  const file = await zip.folder(fileName)
  if (file === null) {
    throw new Error(`Unable to find the folder '${fileName}'.`)
  }
  return file
}

const writeImg = async (folder: WriteableFolder, name: string | number, img: HTMLImageElement) => {
  const blob = await writeImgToBlob(img)
  await folder.file(`${name}.png`, blob)
}

const getNameIndexFileIfNeeded = async (folder: ReadableFolder): Promise<string[]> => {
  if (!keepFilesNice) {
    return []
  }
  const dataFolder = await getDataRootFolderReadable(folder)
  const file = await dataFolder.file("name_index")
  if (file === null) {
    return []
  }
  return JSON.parse(await file.async("text"))
}

const writeNameIndexFileIfNeeded = async (folder: WriteableFolder, names: string[]) => {
  if (!keepFilesNice) {
    return
  }
  const dataFolder = await getDataRootFolderWriteable(folder)
  await dataFolder.file("name_index", JSON.stringify(names))
}

const getDataRootFolderReadable = async (fallback: ReadableFolder) => {
  if (keepFilesNice && dumbcodeHiddenFolder_read !== null) {
    const folder = await dumbcodeHiddenFolder_read.folder(fallback.name)
    if (folder !== null) {
      return folder
    }
  }
  return fallback
}

const getDataRootFolderWriteable = async (fallback: WriteableFolder) => {
  if (keepFilesNice && dumbcodeHiddenFolder_write !== null) {
    const folder = await dumbcodeHiddenFolder_write.folder(fallback.name)
    if (folder !== null) {
      return folder
    }
  }
  return fallback
}
