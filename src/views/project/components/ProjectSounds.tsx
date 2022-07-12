import ClickableInput from "../../../components/ClickableInput"
import { SVGUpload } from "../../../components/Icons"
import StudioSoundPlayableEntry from "../../../components/StudioSoundPlayableEntry"
import { useStudio } from "../../../contexts/StudioContext"
import { ReadableFile } from "../../../studio/files/FileTypes"
import { StudioSound } from "../../../studio/formats/sounds/StudioSound"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { BasicProjectFileArea } from "./ProjectFileArea"

const soundExtensions = [".wav", ".mp3", ".ogg"]

const ProjectSounds = () => {
  const { hasProject, getSelectedProject } = useStudio()

  const uploadFile = async (file: ReadableFile) => {
    const project = getSelectedProject()
    const sound = StudioSound.loadFromFile(await file.asFile(), file.name)
    project.sounds.value = [...project.sounds.value, sound]
  }

  return (
    <BasicProjectFileArea
      extensions={soundExtensions}
      onChange={uploadFile}
      title="Sounds"
      buttons={
        <ClickableInput
          onFile={uploadFile}
          accept={soundExtensions}
          multiple
          description="Sound Files"
          className="icon-button"
          tooltip="Upload Animation(s)"
        >
          <SVGUpload className="h-4 w-4 mr-1" />
        </ClickableInput>
      }
    >
      <div className="w-full flex flex-row justify-center items-center dark:text-white">
        {hasProject && <SoundsEntries />}
      </div>
    </BasicProjectFileArea>
  )
}

const SoundsEntries = () => {
  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()
  const [sounds] = useListenableObject(project.sounds)
  return (
    <div className="flex flex-col w-full">
      {sounds.map(s => <StudioSoundPlayableEntry key={s.identifier} sound={s} />)}
    </div>
  )
}

export default ProjectSounds