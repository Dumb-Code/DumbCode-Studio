import { useEffect, useMemo, useState } from "react"
import { SvgArrowRight, SVGCube } from "../../../components/Icons"
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
  // animation.project.selectedCubeManager.
  const { onMouseUp } = useStudio()

  const [foundCube, setFoundCube, deleteFoundCube] = useListenableObjectInMap(animation.keyframeNameOverrides, name)
  const [typedCubeName, setTypedCubename] = useState("")

  const [errorMessage, setErrorMessage] = useState("")

  const [isAwaitingClick, setIsAwaitingClick] = useState(false)

  const manager = animation.project.selectedCubeManager
  useEffect(() => {
    if (!isAwaitingClick) {
      return
    }
    const mouseUpListener = () => {
      if (manager.mouseOverMesh) {
        const cube = manager.getCube(manager.mouseOverMesh)
        setFoundCube(cube.identifier)
        setIsAwaitingClick(false)
        return true
      }
      return false
    }
    onMouseUp.addListener(900, mouseUpListener)
    return () => onMouseUp.removeListener(mouseUpListener)
  }, [manager, isAwaitingClick, onMouseUp, setFoundCube])

  const cubeButtonClicked = () => {
    if (isAwaitingClick) {
      setIsAwaitingClick(false)
      return
    }
    if (manager.selected.value.length === 0) {
      setErrorMessage("")
      setIsAwaitingClick(true)
      return
    } else if (manager.selected.value.length === 1) {
      setErrorMessage("")
      setFoundCube(manager.selected.value[0])
    } else {
      setErrorMessage("Can only select one cube")
      setIsAwaitingClick(true)
      deleteFoundCube()
    }
  }

  const cubeNamedTyped = (value: string) => {
    setTypedCubename(value)
    const cubesWithName = animation.project.model.cubeMap.get(value)
    if (cubesWithName) {
      if (cubesWithName.size === 1) {
        cubesWithName.forEach(c => setFoundCube(c.identifier))
        setErrorMessage("")
      } else {
        setErrorMessage("Too many cubes of that name")
        deleteFoundCube()
      }
    } else {
      setErrorMessage("Cube not found")
      deleteFoundCube()
    }
  }

  const foundDcm = foundCube === undefined ? undefined : animation.project.model.identifierCubeMap.get(foundCube)

  return (
    <>
      <div className="flex flex-row items-center pt-8 first:pt-3 px-2 w-full">
        <p className="dark:text-white bg-gray-200 dark:bg-gray-700 px-1 rounded">{name}</p>
        <p className="dark:text-white ml-3"><SvgArrowRight className="h-4 w-4 " /></p>
        <input
          value={foundDcm?.name?.value ?? typedCubeName}
          onInput={e => cubeNamedTyped(e.currentTarget.value)}
          className={"w-0 flex-grow dark:text-white ml-3 px-1 rounded h-6 " + (foundCube === undefined ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700")}
          type="text"
        />
        <button onClick={cubeButtonClicked} className={"group w-6 h-6 ml-3 flex justify-center items-center rounded " + (isAwaitingClick ? "bg-purple-500" : "bg-gray-500 hover:bg-blue-600")}>
          <SVGCube className="dark:text-white w-4 h-4" />
        </button>
      </div>
      {errorMessage.length !== 0 && <p className="h-0 mx-3 text-sm text-red-500">{errorMessage}</p>}
    </>
  )
}

export default AnimatorSkeletonProperties