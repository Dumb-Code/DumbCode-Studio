import { KeyboardEvent, useCallback, useState } from "react";
import { v4 } from "uuid";
import GithubCommitBox from "../components/GithubCommitBox";
import ValidatedInput, { useValidatedInput, ValidatedInputType } from "../components/ValidatedInput";
import { RemoteProjectEntry, RemoteRepo } from "../studio/formats/project/DcRemoteRepos";
import GithubCommiter from "../studio/git/GithubCommiter";
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes";

const RemoteProjectsDialogBox = ({ repo, editingRemote, onCommit, }: {
  repo: RemoteRepo | null, editingRemote?: RemoteProjectEntry,
  onCommit: (commiter: GithubCommiter, oldEntry: RemoteProjectEntry | undefined, newEntry: RemoteProjectEntry | undefined) => void
}) => {
  const moreThanThree = useCallback((value: string) => value.length >= 3, [])
  const emptyOrMoreThanThree = useCallback((value: string) => value.length === 0 || value.length >= 3, [])

  const modifying = editingRemote == undefined

  const name = useValidatedInput(moreThanThree, editingRemote?.name)
  const model = useValidatedInput(moreThanThree, editingRemote?.model)
  const animationFolder = useValidatedInput(moreThanThree, editingRemote?.animationFolder)
  const textureFolder = useValidatedInput(emptyOrMoreThanThree, editingRemote?.texture?.baseFolder)

  const [deleteRemote, setDeleteRemote] = useState(false)

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
    onCommit(commiter, editingRemote, deleteRemote ? undefined : remote)
  }, [editingRemote, isValid, name.value, model.value, animationFolder.value, textureFolder.value, onCommit, deleteRemote])

  return (
    <OpenedDialogBox width="1200px" height="800px" title={modifying ? "Create new remote Project" : "modify remote project"}>
      <div className="flex flex-row h-full p-4">
        <div className="w-1/3 flex flex-col h-full">
          <EditingEntry name="Name" input={name} />
          <EditingEntry name="Model Location" input={model} placeholder={`assets/models/entities/${name.value.toLowerCase()}/${name.value.toLowerCase()}.dcm`} />
          <EditingEntry name="Animations Folder" input={animationFolder} placeholder={`assets/Animations/entities/${name.value.toLowerCase()}/.dca`} />
          <EditingEntry name="Textures Folder" input={textureFolder} placeholder={`assets/textures/entities/${name.value.toLowerCase()}`} />
          <div className="flex-grow"></div>
          <GithubCommitBox deleteRemote={deleteRemote} setDeleteRemote={setDeleteRemote} repo={repo} processCommit={processCommit} onCommitFinished={clear} />
        </div>
        <div className="h-full w-[2px] bg-gray-700 mx-7"></div>
        <div className="w-2/3">
          file tree goes here
          <br /><br />
          This going to be eventually better. It&apos;ll show the repository as a file structure and allow you to select the folder/file you want, isntead of typing it out.
        </div>
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
    <div className="flex flex-col w-full mb-2 group">
      <div className="w-full flex-grow dark:text-white text-xs">{name}</div>
      <ValidatedInput input={input} className="w-full flex-grow rounded-md bg-gray-700 peer" placeholder={placeholder} onKeyDown={onKeyDown} />
    </div>
  )
}

export default RemoteProjectsDialogBox;