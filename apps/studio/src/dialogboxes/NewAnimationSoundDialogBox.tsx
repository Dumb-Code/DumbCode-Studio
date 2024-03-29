import StudioSoundPlayableEntry from "../components/StudioSoundPlayableEntry"
import DcaSoundLayer, { DcaSoundLayerInstance } from "../studio/formats/animations/DcaSoundLayer"
import { StudioSound } from "../studio/formats/sounds/StudioSound"
import { useListenableObject } from "../studio/listenableobject/ListenableObject"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const NewAnimationSoundDialogBox = ({ layer }: { layer: DcaSoundLayer }) => {
  const [allSounds] = useListenableObject(layer.animation.project.sounds)
  const [sounds, setSounds] = useListenableObject(layer.instances)

  const { clear } = useOpenedDialogBoxes()

  const pickSound = (sound: StudioSound) => {
    setSounds([...sounds, new DcaSoundLayerInstance(layer.animation.project, sound.name.value, layer.animation.time.value)])
    clear()
  }

  return (
    <OpenedDialogBox width="800px" height="800px" title="New Animation Sound">
      <div className="flex flex-col p-4 h-full">
        <div className="font-semibold mb-5">Pick Sound:</div>
        <div className="overflow-y-scroll studio-scrollbar h-[700px]">
          {allSounds.map(s => (
            <div
              onClick={() => pickSound(s)}
              key={s.identifier}
              className="mt-2 first:mt-0 pr-4"
            >
              <StudioSoundPlayableEntry sound={s} />
            </div>
          ))}
        </div>
      </div>
    </OpenedDialogBox >
  )
}

export default NewAnimationSoundDialogBox
