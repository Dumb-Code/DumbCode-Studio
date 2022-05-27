import JSZip, { JSZipObject } from "jszip";
import { imgSourceToElement } from "../../util/Utils";
import { loadDCMModel } from "../model/OldDCMLoader";
import { TextureGroup } from "../textures/TextureManager";
import DcProject from "./DcProject";

export const loadDcProj = async (name: string, buffer: ArrayBuffer) => {
  const zip = await JSZip.loadAsync(buffer)

  const model = await loadDcProjModel(zip)
  const project = new DcProject(name, model)

  const textures = zip.folder("textures")
  if (textures != null) {
    loadTextures(textures, project)
  }

  return project
}

const loadDcProjModel = async (zip: JSZip) => loadDCMModel(file(zip, 'model.dcm').async('arraybuffer'))


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
// 
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
  const filePromises: Promise<HTMLImageElement>[] = []
  for (let index = 0, file: JSZipObject | null = null; (file = folder.file(`${index}.png`)) !== null; index++) {
    const awaitedTexture = file.async('blob').then(texture => imgSourceToElement(URL.createObjectURL(texture)))
    filePromises.push(awaitedTexture)
  }
  return Promise.all(filePromises)
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

const file = (zip: JSZip, fileName: string) => {
  const file = zip.file(fileName)
  if (file === null) {
    throw new Error(`Unable to find the file '${fileName}'.`)
  }
  return file
}