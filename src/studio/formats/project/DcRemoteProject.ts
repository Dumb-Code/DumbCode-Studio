import { loadDCMModel } from '../model/DCMLoader';
import { TextureGroup } from '../textures/TextureManager';
import DcProject from './DcProject';
import DcRemoteRepo, { RemoteProjectEntry } from './DcRemoteRepos';

export const loadRemoteProject = async (repo: DcRemoteRepo, entry: RemoteProjectEntry) => {
  const model = await loadRemoteModel(repo, entry)
  if (model === null) {
    alert("Unable to load model at \n" + entry.model)
    return null;
  }
  const project = new DcProject(entry.name, model)

  // project.textureManager.addTexture()
  if (entry.texture) {
    loadAllTextures(repo, entry.texture, project)
  }
  //TODO: load the rest of the projects :)

  return project
}

const loadRemoteModel = async (repo: DcRemoteRepo, entry: RemoteProjectEntry) => {
  const model = await repo.getContent(entry.model)
  if (model.type === "file") {
    const arraybuffer = Uint8Array.from(model.content, c => c.charCodeAt(0)).buffer
    return await loadDCMModel(arraybuffer, model.name)
  }
  return null
}

const loadIndividualTexture = async (repo: DcRemoteRepo, baseLoc: string, texture: string) => {
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

const loadAllTextures = async (repo: DcRemoteRepo, entry: NonNullable<RemoteProjectEntry['texture']>, project: DcProject) => {
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

  project.textureManager.addGroup(...finishedGroups)
}