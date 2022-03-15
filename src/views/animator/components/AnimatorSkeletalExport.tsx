import { KeyboardEvent } from "react"
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel"
import Toggle from "../../../components/Toggle"
import { useTooltipRef } from "../../../contexts/TooltipContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { writeDCAAnimation } from "../../../studio/formats/animations/DCALoader"
import { DCMCube } from "../../../studio/formats/model/DcmModel"
import { downloadBlob } from "../../../studio/util/FileTypes"
import { useListenableObjectInMapNullable, useListenableObjectNullable } from "../../../studio/util/ListenableObject"


const AnimatorSkeletalExport = ({ animation, cube }: { animation: DcaAnimation | null, cube?: DCMCube }) => {
  const [nameOverride, setNameOverride, deleteOverride] = useListenableObjectInMapNullable(animation?.keyframeNameOverrides, cube?.identifier, [animation, cube])
  const [overridesOnly, setOverridesOnly] = useListenableObjectNullable(animation?.nameOverridesOnly)

  const inputKeyPressed = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (nameOverride === undefined || nameOverride.length === 0)) {
      setNameOverride(cube?.name?.value ?? "")
    }
  }

  const exportDcsa = () => {
    if (!animation) {
      return
    }
    const newAnimation = animation.cloneAnimation()

    newAnimation.isSkeleton.value = true

    const model = newAnimation.project.model

    //Delete any non keyframe name overrides
    newAnimation.keyframes.value.forEach(keyframe => {
      for (let map of [keyframe.position, keyframe.rotation, keyframe.cubeGrow]) {

        const newMap = new Map<string, readonly [number, number, number]>()
        animation.reverseKeyframeNameOverrides.forEach((identifs, name) => {

          if (identifs.length > 1) {
            //show this to the user, and don't continue the export?
            console.warn(`Name '${name}' is used multiple times, [${identifs.map(id => model.identifierCubeMap.get(id)?.name?.value ?? "??").join(" ")}]`)
          }

          const cube = newAnimation.project.model.identifierCubeMap.get(identifs[0])
          if (cube) {
            const values = map.get(cube.name.value)
            if (values) {
              newMap.set(name, values)
            }
          }
        })

        map.clear()
        map.putAllSilently(newMap)
      }
    })

    //Remove now-empty keyframes
    newAnimation.keyframes.value = newAnimation.keyframes.value.filter(kf => kf.position.size !== 0 || kf.rotation.size !== 0 || kf.cubeGrow.size !== 0)

    downloadBlob(animation.name.value + "_skeleton.dcsa", writeDCAAnimation(newAnimation))
  }

  return (
    <CollapsableSidebarPannel title="SKELETAL EXPORT" heightClassname="h-36" panelName="animator_se">
      <div className="dark:text-white px-2 mt-2 flex flex-row">
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow mb-2">NAME OVERRIDE</p>
        <input
          value={nameOverride ?? ""}
          onInput={e => {
            const value = e.currentTarget.value
            if (value.length === 0) {
              deleteOverride()
            } else {
              setNameOverride(value)
            }
          }}
          onKeyPress={inputKeyPressed}
          className="border-none dark:text-white text-black dark:bg-gray-700 bg-white pt-1.5 mb-1 text-xs h-7 col-span-2 mx-1 rounded focus:outline-none focus:ring-gray-800"
          placeholder={cube?.name?.value ?? ""}
          type="text"
          disabled={animation === undefined || cube === undefined}
        />
      </div>
      <div
        className="dark:text-white px-2 mt-2"
        ref={useTooltipRef("When enabled, only name overrides will animate. Otherwise, no name overrides will animate.")}
      >
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow mb-2">EXPORT MODE</p>
        <div className="flex flex-row">
          <Toggle
            checked={overridesOnly ?? false}
            setChecked={c => setOverridesOnly(c)}
          />
        </div>
      </div>
      <div className="dark:text-white px-2 mt-2">
        <button onClick={exportDcsa} className="bg-blue-500 rounded p-1">Download .dcsa</button>
      </div>
    </CollapsableSidebarPannel>
  )
}

export default AnimatorSkeletalExport