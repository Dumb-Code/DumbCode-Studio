import { supportedSoundExtensions } from '../../../views/project/components/ProjectSounds';
import { ReferenceImage } from '../../util/ReferenceImageHandler';
import { TextureGroup } from '../textures/TextureManager';
import { imgSourceToElement } from './../../util/Utils';
import { loadUnknownAnimation } from './../animations/DCALoader';
import { loadModelUnknown } from './../model/DCMLoader';
import { DCMModel } from './../model/DcmModel';
import { StudioSound } from './../sounds/StudioSound';
import DcProject from './DcProject';
import { DcRemoteRepoContentGetterCounter, RemoteProjectEntry } from './DcRemoteRepos';

export const loadRemoteProject = async (repo: DcRemoteRepoContentGetterCounter, entry: RemoteProjectEntry) => {
  let animationPaths: { name: string; path: string; }[] = []
  if (entry.animationFolder) {
    animationPaths = await getAllFilePaths(repo, entry.animationFolder, ".dca")
    repo.addUnforseenRequests(animationPaths.length)
  }
  let soundPaths: { name: string; path: string; }[] = []
  if (entry.soundFolder) {
    soundPaths = await getAllFilePaths(repo, entry.soundFolder, ...supportedSoundExtensions)
    repo.addUnforseenRequests(soundPaths.length)
  }

  const model = await loadRemoteModel(repo, entry)
  const project = new DcProject(entry.name, model)

  let textures: Promise<any> | null = null
  if (entry.texture) {
    textures = loadAllTextures(repo, entry.texture, project)
  }

  let animations: Promise<any> | null = null
  if (entry.animationFolder) {
    animations = loadAllAnimations(repo, animationPaths, project)
  }
  let referenceImages: Promise<any> | null = null
  if (entry.referenceImages !== undefined) {
    referenceImages = loadAllReferenceImages(project, entry.referenceImages)
  }

  if (entry.showcaseViews !== undefined) {
    project.showcaseProperties.loadViewsFromJson(entry.showcaseViews)
  }

  let sounds: Promise<any> | null = null
  if (entry.soundFolder !== undefined) {
    sounds = loadAllSounds(repo, soundPaths, project)
  }

  await Promise.all([textures, animations, referenceImages, sounds])

  project.onProjectLoaded()

  project.remoteLink = {
    allData: repo.allData,
    repo: repo.repo,
  }
  project.remoteUUID = entry.uuid
  return project
}

const loadRemoteModel = async (repo: DcRemoteRepoContentGetterCounter, entry: RemoteProjectEntry) => {
  const model = await repo.getContent(entry.model, true)
  if (model.type === "file") {
    const arraybuffer = Buffer.from(model.content, 'base64').buffer
    return await loadModelUnknown(arraybuffer, model.name)
  }
  const newModel = new DCMModel()
  newModel.needsSaving.value = true
  return newModel
}

const loadIndividualTexture = async (repo: DcRemoteRepoContentGetterCounter, baseLoc: string, texture: string) => {
  return repo.getContent(`${baseLoc}${texture}.png`, true)
    .then(async (d) => {
      if (d.type === "file") {
        return {
          fileName: texture,
          img: await loadImg(d.content.replaceAll('\n', '')),
        }
      }
      return null
    })
}

const loadImg = async (content: string) => {
  return imgSourceToElement('data:image/png;base64,' + content)
}

const loadAllTextures = async (repo: DcRemoteRepoContentGetterCounter, entry: NonNullable<RemoteProjectEntry['texture']>, project: DcProject) => {
  const { baseFolder, groups } = entry
  const groupData = await Promise.all(groups.map(async (group) => {
    const baseLoc = `${baseFolder}/${group.folderName}${group.folderName === '' ? '' : '/'}`
    const datas = Promise.all(group.textures.map(t => loadIndividualTexture(repo, baseLoc, t)))
    return {
      group,
      images: datas
    }
  }))

  const finishedGroups = await Promise.all(groupData.map(async (group) => {
    const newGroup = new TextureGroup(project.textureManager, group.group.groupName, group.group.isDefault ?? group.group.folderName === "")
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

const getAllFilePaths = async (repo: DcRemoteRepoContentGetterCounter, animationFolder: string, ...extensions: string[]) => {
  const res = await repo.getContent(animationFolder)
  if (res.type !== "dir") {
    console.warn(animationFolder + " is not a folder, skipping")
    return []
  }
  return res.files.filter(f => extensions.some(e => f.name.endsWith(e)))
}

const loadAllAnimations = async (repo: DcRemoteRepoContentGetterCounter, animations: { name: string; path: string; }[], project: DcProject) => {
  const loadedAnimations = await Promise.all(animations.map(async (animation) => {
    const content = await repo.getContent(animation.path, true)
    if (content.type === "file") {
      const arraybuffer = Buffer.from(content.content, 'base64').buffer
      return loadUnknownAnimation(project, content.name.substring(0, content.name.lastIndexOf('.')), arraybuffer)
    }
    return null
  }))

  loadedAnimations.forEach(t => t !== null && project.animationTabs.addAnimation(t))
}

const loadAllSounds = async (repo: DcRemoteRepoContentGetterCounter, soundPaths: { name: string; path: string; }[], project: DcProject) => {
  const loadedSounds = await Promise.all(soundPaths.map(async (sound) => {
    const content = await repo.getContent(sound.path, true)
    if (content.type === "file") {
      const arraybuffer = Buffer.from(content.content, 'base64').buffer
      const blob = new Blob([arraybuffer])
      return StudioSound.loadFromFile(blob, content.name)
    }
    return null
  }))

  project.sounds.value = loadedSounds.filter((s): s is StudioSound => s !== null)
}

const loadAllReferenceImages = async (project: DcProject, referenceImages: NonNullable<RemoteProjectEntry['referenceImages']>) => {
  const loadedReferenceImages = await Promise.all(referenceImages.map((async (img) =>
    new ReferenceImage(
      project.referenceImageHandler, await loadImg(img.data),
      img.name, img.opacity, img.canSelect, img.hidden,
      img.position, img.rotation, img.scale, img.flipX, img.flipY
    ))))
  project.referenceImageHandler.images.value = loadedReferenceImages
}

export const countTotalRequests = (project: RemoteProjectEntry) =>
  1 //model

  + (
    project.texture ?
      project.texture?.groups.map(g => g.textures.length).reduce((a, b) => a + b, 0) :
      0
  ) //texture

  + (project.animationFolder ? 1 : 0) //query the animation folder, we then add the amount of .dcas on.
  + (project.soundFolder ? 1 : 0) //query the sound folder, we then add the amount of sound files on.
  ;