import { useCallback, useState } from "react"
import Checkbox from "../components/Checkbox"
import GithubCommitBox from "../components/GithubCommitBox"
import DcaAnimation from "../studio/formats/animations/DcaAnimation"
import { writeDCAAnimationWithFormat } from "../studio/formats/animations/DCALoader"
import { writeModelWithFormat } from "../studio/formats/model/DCMLoader"
import DcProject from "../studio/formats/project/DcProject"
import { TextureGroup } from "../studio/formats/textures/TextureManager"
import GithubCommiter from "../studio/git/GithubCommiter"
import { LO, useListenableObject } from "../studio/util/ListenableObject"
import { writeImgToBase64 } from "../studio/util/Utils"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const PushToGithubDialogBox = ({ project }: { project: DcProject }) => {

  const [model, setModel] = useState(project.model.needsSaving.value)

  const [animations, setAnimations] = useState<readonly number[]>(() =>
    project.animationTabs.animations.value
      .map((anim, index) => ({ anim, index }))
      .filter(({ anim }) => anim.needsSaving.value)
      .map(({ index }) => index)
  )

  const [textures, setTextures] = useState<readonly number[]>(() =>
    project.textureManager.textures.value
      .map((texture, index) => ({ texture, index }))
      // .filter(({ texture }) => texture.needsSaving.value) //TODO: add this when texture dirty is implimented
      .map(({ index }) => index)
  )

  const processCommit = useCallback(async (comitter: GithubCommiter) => {
    if (project.remoteLink === undefined) {
      return
    }
    const awaiters: Promise<any>[] = []


    const { entry } = project.remoteLink
    if (model) {
      const exportModel = async () => {
        comitter.pushChange(entry.model, await writeModelWithFormat(project.model, "base64"), true)
      }
      awaiters.push(exportModel())
    }

    if (entry.animationFolder !== undefined) {
      const exportAnimation = async (animation: DcaAnimation) => {
        comitter.pushChange(`${entry.animationFolder}/${animation.name}.dca`, await writeDCAAnimationWithFormat(animation, "base64"), true)
      }
      project.animationTabs.animations.value.filter((_, index) => animations.includes(index)).forEach(animation => awaiters.push(exportAnimation(animation)))
    }

    if (entry.texture !== undefined) {
      const baseFolder = entry.texture?.baseFolder
      const exportTexture = async (group: TextureGroup, textureUUID: string) => {
        const texture = project.textureManager.textures.value.find(t => t.identifier === textureUUID)
        if (texture !== undefined && textures.includes(project.textureManager.textures.value.indexOf(texture))) {
          comitter.pushChange(`${baseFolder}/${group.folderName.value}${group.folderName.value === '' ? '' : '/'}${texture.name.value}.dca`, await writeImgToBase64(texture.element.value), true)
        }
      }
      project.textureManager.groups.value.forEach(group => group.textures.value.map(texture => awaiters.push(exportTexture(group, texture))))
    }

    await Promise.all(awaiters)
  }, [project, model, animations, textures])

  const { clear } = useOpenedDialogBoxes()

  return (
    <OpenedDialogBox width="800px" height="1000px" title="Push To Github">
      <div className="flex flex-col h-full">
        <div className="font-bold dark:text-white">What to push?</div>
        <Checkbox value={model} setValue={setModel} extraText="Model" />

        <div className="font-bold mt-1 flex flex-row">
          Animations:
          <Checkbox
            value={animations.length === project.animationTabs.animations.value.length}
            setValue={v => setAnimations(v ? project.animationTabs.animations.value.map((_, index) => index) : [])}
            extraText="All"
          />
        </div>
        <div className="h-64 overflow-y-scroll studio-scrollbar">
          {project.animationTabs.animations.value.map((anim, index) => <NumberedList key={index} nameLO={anim.name} list={animations} setList={setAnimations} number={index} />)}
        </div>

        <div className="font-bold mt-1 flex flex-row">
          Textures:
          <Checkbox
            value={textures.length === project.textureManager.textures.value.length}
            setValue={v => setTextures(v ? project.textureManager.textures.value.map((_, index) => index) : [])}
            extraText="All"
          />
        </div>
        <div className="h-64 overflow-y-scroll studio-scrollbar">
          {project.textureManager.textures.value.map((texture, index) => <NumberedList key={index} nameLO={texture.name} list={textures} setList={setTextures} number={index} />)}
        </div>
        <GithubCommitBox repo={project.remoteLink?.repo ?? null} processCommit={processCommit} onCommitFinished={clear} />
      </div>
    </OpenedDialogBox>
  )
}

const NumberedList = ({ nameLO, list, setList, number }: { nameLO: LO<string>, list: readonly number[], setList: (list: readonly number[]) => void, number: number }) => {
  const [name] = useListenableObject(nameLO)
  const setValue = useCallback((value: boolean) => {
    let newList: readonly number[]
    if (value) {
      newList = list.concat(number)
    } else {
      newList = list.filter(n => n !== number)
    }
    setList(newList)
  }, [list, setList, number])
  return <Checkbox value={list.includes(number)} setValue={setValue} extraText={name} />
}

export default PushToGithubDialogBox