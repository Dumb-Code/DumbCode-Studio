import JSZip, { JSZipObject } from "jszip";
import { ReferenceImage } from "../../util/ReferenceImageHandler";
import { imgSourceToElement } from "../../util/Utils";
import { loadUnknownAnimation } from "../animations/DCALoader";
import { loadModelUnknown } from "../model/DCMLoader";
import { DCMCube } from "../model/DcmModel";
import { TextureGroup } from "../textures/TextureManager";
import { KeyframeLayerData } from './../animations/DcaAnimation';
import DcProject from "./DcProject";

export const loadDcProj = async (name: string, buffer: ArrayBuffer) => {
  const zip = await JSZip.loadAsync(buffer)

  const model = await loadDcProjModel(zip)
  const project = new DcProject(name, model)

  const awaiters: Promise<void>[] = []

  const textures = zip.folder("textures")
  if (textures != null) {
    awaiters.push(loadTextures(textures, project))
  }

  const animations = zip.folder("animations")
  if (animations != null) {
    awaiters.push(loadAnimations(animations, project))
  }

  const refImges = zip.folder("ref_images")
  if (refImges != null) {
    awaiters.push(loadRefImages(refImges, project))
  }

  await Promise.all(awaiters)

  return project
}

const loadDcProjModel = async (zip: JSZip) => loadModelUnknown(file(zip, 'model.dcm').async('arraybuffer'))

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
  }[]
}

type LegacyAnimationData = {
  ikaCubes: string[] //This is cube NAMES, we need to convert this to cube IDENTIFIERS
  keyframeInfo: KeyframeLayerDataJson[]
}

const loadAnimations = async (folder: JSZip, project: DcProject) => {
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

    animation.keyframeLayers.value = data.layers.map(layer => new KeyframeLayerData(layer.id, layer.name, layer.visible, layer.locked, layer.definedMode))

    project.animationTabs.addAnimation(animation)
  })


}

const loadAnimationData = async (folder: JSZip): Promise<AnimationData> => {
  const dataFile = folder.file("data.json")
  if (dataFile === null) {
    return loadLegacyAnimationData(folder)
  }
  return dataFile.async("text").then(file => JSON.parse(file) as AnimationData)
}

const loadLegacyAnimationData = async (folder: JSZip): Promise<AnimationData> => {
  const [animationNames, dataFiles] = await Promise.all([
    file(folder, "animation_names").async("text").then(s => s.split("\n")),
    Promise.all(getFileArray(folder, "json")
      .map(file => file.async("text").then(file => JSON.parse(file) as LegacyAnimationData))
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


const loadDcaAnimations = (folder: JSZip, project: DcProject) => {
  return Promise.all(getFileArray(folder, "dca")
    .map((file, index) => file.async("arraybuffer").then(arrayBuffer => loadUnknownAnimation(project, `Dc_ProjAnim_${index}`, arrayBuffer)))
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

type TextureData = { texture_names: string[], groups: TextureGroupData[], textures_need_flipping?: true }
type TextureGroupData = { name: string, layerIDs: number[] }

const loadTextures = async (folder: JSZip, project: DcProject) => {
  const [imgs, datas] = await Promise.all([
    getTexturesArray(folder),
    getTexturesData(folder)
  ])

  const textures = imgs.map((img, index) => project.textureManager.addTexture(datas.texture_names[index], img))

  //For some reason, the legacy code reverses the array list here?
  if (datas.textures_need_flipping === true) {
    textures.reverse()
  }

  datas.groups.forEach(groupData => {
    const group = new TextureGroup(groupData.name, false);
    groupData.layerIDs.forEach(id => group.toggleTexture(textures[id], true))
    project.textureManager.addGroup(group)
  })
}

const getTexturesArray = (folder: JSZip) => {
  return Promise.all(getFileArray(folder, "png")
    .map(file => file.async('blob').then(texture => imgSourceToElement(URL.createObjectURL(texture))))
  )
}

const getTexturesData = (folder: JSZip): Promise<TextureData> => {
  const dataFile = folder.file("data.json")
  if (dataFile === null) {
    return getLegacyTexturesData(folder)
  }
  return dataFile.async('text').then(g => JSON.parse(g) as TextureData)
}

const getLegacyTexturesData = async (folder: JSZip): Promise<TextureData> => {
  const [groups, textureNames] = await Promise.all([
    file(folder, "groups.json").async('text').then(g => JSON.parse(g) as TextureGroupData[]),
    file(folder, "texture_names").async('text').then(s => s.split("\n"))
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
  pos: [number, number, number],
  rot: [number, number, number],
  scale: number | [number, number, number],
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
const loadRefImages = async (folder: JSZip, project: DcProject) => {
  const data = await getRefImagesData(folder)
  const images = await getRefImages(folder, data.new_format ? null : data.entries.map(e => e.name))

  console.log(data, images)
  project.referenceImageHandler.images.value = images.map((img, i) => {
    const d = data.entries[i];

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

const getRefImagesData = async (folder: JSZip): Promise<RefImgData> => {
  const dataFile = await file(folder, "data.json").async('text').then(g => JSON.parse(g) as RefImgData | LegacyRefImgData)
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

const getRefImages = async (folder: JSZip, legacyImgNames: string[] | null): Promise<HTMLImageElement[]> => {
  return Promise.all(getFileArrayIndex(folder, index => (legacyImgNames !== null ? legacyImgNames[index] : index) + ".png")
    .map(file => file.async('blob').then(texture => imgSourceToElement(URL.createObjectURL(texture))))
  )
}

// --- Utils

const getFileArray = (folder: JSZip, extension: string) => getFileArrayIndex(folder, index => `${index}.${extension}`)

const getFileArrayIndex = (folder: JSZip, applier: (index: number) => string) => {
  const files: JSZipObject[] = []
  for (let index = 0, file: JSZipObject | null = null; (file = folder.file(applier(index))) !== null; index++) {
    files.push(file)
  }
  return files
}

const file = (zip: JSZip, fileName: string) => {
  const file = zip.file(fileName)
  if (file === null) {
    throw new Error(`Unable to find the file '${fileName}'.`)
  }
  return file
}