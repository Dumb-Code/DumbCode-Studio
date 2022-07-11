import { useEffect, useMemo, useRef } from "react"
import ClickableInput from "../../../components/ClickableInput"
import { SVGPause, SVGPlay, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { ReadableFile } from "../../../studio/files/FileTypes"
import { StudioSound } from "../../../studio/formats/sounds/StudioSound"
import StudioSoundInstance from "../../../studio/formats/sounds/StudioSoundInstance"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { BasicProjectFileArea } from "./ProjectFileArea"

const soundExtensions = [".wav", ".mp3"]

const ProjectSounds = () => {
  const { hasProject, getSelectedProject } = useStudio()

  const uploadFile = async (file: ReadableFile) => {
    const project = getSelectedProject()
    const sound = StudioSound.loadFromFile(file, file.name)
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

  const instance = useMemo(() => new StudioSoundInstance(sound), [sound])
  useEffect(() => () => instance.dispose(), [instance])

  const [isPlaying, setIsPlaying] = useListenableObject(instance.playing)

  const Icon = isPlaying ? SVGPause : SVGPlay

  const onClickSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    instance.seek(percent * instance.sound.duration)
  }

  return (
    <div className="flex flex-row w-full mt-4 first:mt-0 bg-blend-normal">
      <div className="flex-grow min-w-0 break-words">{name}</div>
      <div className="relative flex-shrink-0 w-[100px] h-[30px] ml-2">
        {src !== null ?
          <>
            <div
              onClick={onClickSeek}
              className="w-full h-full"
              style={{
                backgroundImage: `url(${src})`,
              }}
            />
            <PlaybackOverlay instance={instance} src={src} />
          </> :
          <div className="text-gray-500">Loading...</div>
        }
      </div>
      {src !== null &&
        <ButtonWithTooltip tooltip={isPlaying ? "Pause" : "Play"} className="icon-button ml-2" onClick={() => setIsPlaying(!isPlaying)}>
          <Icon className="h-5 w-5 -ml-1" />
        </ButtonWithTooltip>
      }
    </div>
  )
}

const PlaybackOverlay = ({ instance, src }: { instance: StudioSoundInstance, src: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [playing] = useListenableObject(instance.playing)
  useEffect(() => {
    const el = ref.current
    if (el === null) {
      return
    }

    let requestId = -1
    const onFrame = () => {
      requestId = requestAnimationFrame(onFrame)
      const position = instance.getPlaybackPosition()
      const percent = position / instance.sound.duration
      el.style.clipPath = `inset(0 ${(1 - percent) * 100}% 0 0)`
    }
    onFrame()
    return () => {
      if (requestId !== -1) {
        cancelAnimationFrame(requestId)
      }
    }
  }, [instance, playing])


  return (
    <div ref={ref} className="absolute left-0 top-0 w-full h-full pointer-events-none  " style={{
      backgroundImage: `url(${src})`,
      filter: 'invert(75%)'
    }} />
  )
}

export default ProjectSounds