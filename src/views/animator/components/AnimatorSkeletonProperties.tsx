import { useEffect, useMemo, useState } from "react"
import CubeSelectionInputButton from "../../../components/CubeSelectionInputButton"
import { SvgArrowRight } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { useListenableObject, useListenableObjectInMap } from "../../../studio/util/ListenableObject"
import { NumArray } from "../../../studio/util/NumArray"

const AnimatorSkeletonProperties = () => {

  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()
  const [animation] = useListenableObject(project.animationTabs.selectedAnimation)

  const allNames = useMemo(() => {
    if (!animation) {
      return []
    }
    return Array.from(new Set(
      animation.keyframes.value
        .flatMap(kf => [kf.position, kf.rotation, kf.cubeGrow])
        .flatMap(map => Array.from(map.keys()))
    ))
  }, [animation])


  const [isDone, setIsDone] = useState(false)
  useEffect(() => {
    if (!animation) {
      return
    }
    const listener = () => {
      const notExist = allNames.some(name => !animation.keyframeNameOverrides.has(name))
      setIsDone(!notExist)
    }
    animation.keyframeNameOverrides.addGlobalListener(listener)
    return () => {
      animation.keyframeNameOverrides.removeGlobalListener(listener)
    }
  }, [animation, allNames])

  const doneButtonClicked = () => {
    if (isDone && animation) {
      //keyframeNameOverrides is a map of [name: identifier]
      //We need to go through the .dca, and rename all instances of name, to the cube name of identifier.
      //Then set isSkeleton to false

      const nameToCubeNameMap = new Map<string, string>()
      animation.keyframeNameOverrides.forEach((id, name) => {
        const cube = animation.project.model.identifierCubeMap.get(id)
        if (cube) {
          nameToCubeNameMap.set(name, cube.name.value)
        }
      })

      animation.keyframes.value
        .flatMap(kf => [kf.position, kf.rotation, kf.cubeGrow])
        .forEach(map => {
          const newMap = new Map<string, NumArray>()
          map.forEach((value, key) => {
            const replacement = nameToCubeNameMap.get(key)
            if (replacement) {
              newMap.set(replacement, value)
            }
          })

          map.clear()
          map.putAllSilently(newMap)
        })


      console.log(animation.keyframes.value)

      animation.isSkeleton.value = false
    }
  }

  return (
    <div className="h-full flex flex-col items-center dark:bg-gray-800 bg-gray-200 p-2">
      <p className="dark:text-white">Match up the animation cubes.</p>
      <div className="w-full flex-grow h-0 overflow-x-hidden overflow-y-scroll studio-scrollbar bg-gray-700 mt-2 ">
        {animation && allNames.map(name => <SkeletonEntry key={name} animation={animation} name={name} />)}
      </div>
      <button onClick={doneButtonClicked} className={"w-min rounded px-2 mt-2 " + (isDone ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500")}>
        Done
      </button>
    </div>
  )
}

const SkeletonEntry = ({ animation, name }: { animation: DcaAnimation, name: string }) => {
  const [foundCube, setFoundCube, deleteFoundCube] = useListenableObjectInMap(animation.keyframeNameOverrides, name)

  const [errorMessage, setErrorMessage] = useState("")

  const foundDcm = foundCube === undefined ? undefined : animation.project.model.identifierCubeMap.get(foundCube)

  return (
    <>
      <div className="flex flex-row items-center pt-8 first:pt-3 px-2 w-full">
        <p className="dark:text-white bg-gray-200 dark:bg-gray-700 px-1 rounded">{name}</p>
        <p className="dark:text-white ml-3"><SvgArrowRight className="h-4 w-4 " /></p>
        <CubeSelectionInputButton
          cube={foundDcm ?? null}
          setCube={cube => cube ? setFoundCube(cube.identifier) : deleteFoundCube()}
          setErrorMessage={setErrorMessage}
          allowInferedSelection
        />
      </div>
      {errorMessage.length !== 0 && <p className="h-0 mx-3 text-sm text-red-500">{errorMessage}</p>}
    </>
  )
}

export default AnimatorSkeletonProperties