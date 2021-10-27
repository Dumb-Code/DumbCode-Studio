import { loadDCMModel } from '../model/DCMLoader';
import { TextureGroup } from '../textures/TextureManager';
import DcProject from './DcProject';
import { DcRemoteRepoContentGetterCounter, RemoteProjectEntry } from './DcRemoteRepos';

export const loadRemoteProject = async (repo: DcRemoteRepoContentGetterCounter, entry: RemoteProjectEntry) => {
  const model = await loadRemoteModel(repo, entry)
  if (model === null) {
    alert("Unable to load model at \n" + entry.model)
    return null;
  }
  const project = new DcProject(entry.name, model)

  let textures: Promise<any> | null = null
  if (entry.texture) {
    textures = loadAllTextures(repo, entry.texture, project)
  }

  let animations: Promise<any> | null = null
  let referenceImages: Promise<any> | null = null


  await Promise.all([textures, animations, referenceImages])

  project.remoteLink = repo.repo
  project.remoteUUID = entry.uuid
  return project
}

const loadRemoteModel = async (repo: DcRemoteRepoContentGetterCounter, entry: RemoteProjectEntry) => {
  const model = await repo.getContent(entry.model)
  if (model.type === "file") {
    const arraybuffer = Uint8Array.from(model.content, c => c.charCodeAt(0)).buffer
    return await loadDCMModel(arraybuffer, model.name)
  }
  return null
}

const loadIndividualTexture = async (repo: DcRemoteRepoContentGetterCounter, baseLoc: string, texture: string) => {
  return repo.getContent(`${baseLoc}${texture}.png`, true)
    .then(async (d) => {
      if (d.type === "file") {
        let img = document.createElement("img")
        img.src = 'data:image/png;base64,' + d.content.replaceAll('\n', '')
        await new Promise(resolve => img.onload = resolve)
        img.onload = null
        return {
          fileName: texture,
          img,
        }
      }
      return null
    })
}

const loadAllTextures = async (repo: DcRemoteRepoContentGetterCounter, entry: NonNullable<RemoteProjectEntry['texture']>, project: DcProject) => {
  const { baseFolder, groups } = entry
  const groupData = await Promise.all(groups.map(async (group) => {
    const baseLoc = `${baseFolder}/${group.folderName}${group.folderName === '' ? '' : '/'}`
    const datas = Promise.all(group.textures.map(t => loadIndividualTexture(repo, baseLoc, t)))
    return {
      name: group.groupName,
      images: datas
    }
  }))

  const finishedGroups = await Promise.all(groupData.map(async (group) => {
    const newGroup = new TextureGroup(group.name, false)
    const identifiers = await group.images.then(imgs => Promise.all(imgs.map(img => {
      if (img === null) {
        return null
      }
      return project.textureManager.addTexture(img.fileName, img.img).identifier
    })))
    newGroup.textures.value = identifiers.filter(a => a !== null) as string[]
    return newGroup
  }))

  //Set the default group textures to be properly ordered
  const textures = finishedGroups.flatMap(g => g.textures.value)
  project.textureManager.defaultGroup.textures.value = textures

  project.textureManager.addGroup(...finishedGroups)
}

export const countTotalRequests = (project: RemoteProjectEntry) =>
  1 //model
  + (
    project.texture ?
      project.texture?.groups.map(g => g.textures.length).reduce((a, b) => a + b, 0) :
      0
  ) //texture
  ;