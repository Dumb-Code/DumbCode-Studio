import StudioSoundPlayableEntry from "../components/StudioSoundPlayableEntry"
import DcaSoundLayer, { DcaSoundLayerInstance } from "../studio/formats/animations/DcaSoundLayer"
import { StudioSound } from "../studio/formats/sounds/StudioSound"
import { useListenableObject } from "../studio/util/ListenableObject"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const NewAnimationSoundDialogBox = ({ layer }: { layer: DcaSoundLayer }) => {
  const [allSounds] = useListenableObject(layer.animation.project.sounds)
  const [sounds, setSounds] = useListenableObject(layer.instances)

  const { clear } = useOpenedDialogBoxes()

  const pickSound = (sound: StudioSound) => {
    setSounds([...sounds, new DcaSoundLayerInstance(layer.animation, sound.identifier, layer.animation.time.value)])
    clear()
  }

  return (
    <OpenedDialogBox width="800px" height="800px" title="New Animation Sound">
      <div className="flex flex-col p-5 h-full">
        <div className="font-semibold mb-5">Pick Sound:</div>
        <div className="flex flex-col flex-grow bg-gray-200  dark:bg-gray-700">
          {allSounds.map(s => (
            <div
              onClick={() => pickSound(s)}
              key={s.identifier}
              className="hover:bg-blue-500  dark:hover:bg-blue-700 mt-2 first:mt-0 p-1"
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
