import { KeyboardEvent, useCallback } from "react";
import { v4 } from "uuid";
import GithubCommitBox from "../components/GithubCommitBox";
import ValidatedInput, { useValidatedInput, ValidatedInputType } from "../components/ValidatedInput";
import { RemoteProjectEntry, RemoteRepo } from "../studio/formats/project/DcRemoteRepos";
import GithubCommiter from "../studio/git/GithubCommiter";
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes";

const RemoteProjectsDialogBox = ({ token, repo, editingRemote, onCommit, }: {
  token: string, repo: RemoteRepo | null, editingRemote?: RemoteProjectEntry,
  onCommit: (commiter: GithubCommiter, oldEntry: RemoteProjectEntry | undefined, newEntry: RemoteProjectEntry) => void
}) => {
  const moreThanThree = useCallback((value: string) => value.length >= 3, [])
  const emptyOrMoreThanThree = useCallback((value: string) => value.length === 0 || value.length >= 3, [])

  const name = useValidatedInput(moreThanThree, editingRemote?.name)
  const model = useValidatedInput(moreThanThree, editingRemote?.model)
  const animationFolder = useValidatedInput(moreThanThree, editingRemote?.animationFolder)
  const textureFolder = useValidatedInput(emptyOrMoreThanThree, editingRemote?.texture?.baseFolder)

  const isValid = name.valid && model.valid && animationFolder.valid && textureFolder.valid

  const { clear } = useOpenedDialogBoxes()

  const processCommit = useCallback((commiter: GithubCommiter) => {
    if (!isValid) {
      return null
    }
    let remote = editingRemote
    if (remote === undefined) {
      remote = {
        version: 1,
        uuid: v4(),
        name: name.value,
        model: model.value,
        animationFolder: animationFolder.value.length === 0 ? undefined : animationFolder.value,
        texture: textureFolder.value.length === 0 ? undefined : { baseFolder: textureFolder.value, groups: [] }
      }
    } else {
      remote = {
        ...remote,
        name: name.value,
        model: model.value,
        animationFolder: animationFolder.value.length === 0 ? undefined : animationFolder.value,
        texture: textureFolder.value.length === 0 ? undefined : { baseFolder: textureFolder.value, groups: remote.texture?.groups ?? [] }
      }
    }
    onCommit(commiter, editingRemote, remote)
  }, [editingRemote, isValid, name.value, model.value, animationFolder.value, textureFolder.value, onCommit])

  return (
    <OpenedDialogBox width="800px" height="800px" title="Load a Repository">
      <div className="flex flex-col h-full">
        This going to be eventually better. It&apos;ll show the repository as a file structure and allow you to select the folder/file you want, isntead of typing it out.
        <EditingEntry name="Name" input={name} />
        <EditingEntry name="Model" input={model} placeholder={`assets/models/entities/${name.value.toLowerCase()}/${name.value.toLowerCase()}.dcm`} />
        <EditingEntry name="Animation Folder" input={animationFolder} placeholder={`assets/Animations/entities/${name.value.toLowerCase()}/.dca`} />
        <EditingEntry name="Texture Folder" input={textureFolder} placeholder={`assets/textures/entities/${name.value.toLowerCase()}`} />
        <GithubCommitBox token={token} repo={repo} processCommit={processCommit} onCommitFinished={clear} />
      </div>
    </OpenedDialogBox>
  )
}

const EditingEntry = ({ name, placeholder, input }: { input: ValidatedInputType, name: string, placeholder?: string }) => {
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (input.value.trim().length === 0 && e.code === "Enter" && placeholder !== undefined) {
      input.setter(placeholder)
    }
  }, [input, placeholder])
  return (
    <div className="flex flex-row w-full">
      <div className="w-full flex-grow dark:text-white">{name}:</div>
      <ValidatedInput input={input} className="w-full flex-grow" placeholder={placeholder} onKeyDown={onKeyDown} />
    </div>
  )
}

export default RemoteProjectsDialogBox;