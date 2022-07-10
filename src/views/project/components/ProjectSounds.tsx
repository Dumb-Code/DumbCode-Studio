import Image from "next/image"
import ClickableInput from "../../../components/ClickableInput"
import { SVGUpload } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import { ReadableFile } from "../../../studio/files/FileTypes"
import { StudioSound } from "../../../studio/formats/sounds/StudioSound"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { BasicProjectFileArea } from "./ProjectFileArea"

const soundExtensions = [".wav", ".mp3"]

const ProjectSounds = () => {
  const { hasProject, getSelectedProject } = useStudio()

  const uploadFile = async (file: ReadableFile) => {
    const project = getSelectedProject()
    const sound = await StudioSound.loadFromFile(file, file.name)
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
      {sounds.map(s => <SoundEntry key={s.identifier} sound={s} />)}
    </div>
  )
}

const SoundEntry = ({ sound }: { sound: StudioSound }) => {
  const [name] = useListenableObject(sound.name)
  const [src] = useListenableObject(sound.imgUrl)
  return (
    <div className="flex flex-row w-full mt-4 first:mt-0">
      <div className="flex-grow min-w-0 break-words">{name}</div>
      <div className="flex-shrink-0 w-[100px] h-[30px] ml-2">
        {src !== null && <Image alt="Sound Waveform" src={src} width="100px" height="30px" layout="responsive" objectFit="contain" />}
      </div>
    </div>
  )
}

export default ProjectSounds