import { SVGCube } from "@dumbcode/shared/icons"
import { useEffect, useState } from "react"
import { useStudio } from "../contexts/StudioContext"
import { DCMCube } from "../studio/formats/model/DcmModel"

const CubeSelectionInputButton = ({ cube, setCube, setErrorMessage, allowInferedSelection = false }: {
  cube: DCMCube | null,
  setCube: (cube: DCMCube | null) => void,
  setErrorMessage?: (message: string) => void,
  allowInferedSelection?: boolean,
}) => {
  const { onMouseUp, getSelectedProject } = useStudio()
  const project = getSelectedProject()

  const [typedCubeName, setTypedCubename] = useState("")

  const [isAwaitingClick, setIsAwaitingClick] = useState(false)

  const manager = project.selectedCubeManager
  useEffect(() => {
    if (!isAwaitingClick) {
      return
    }
    const mouseUpListener = () => {
      if (manager.mouseOverMesh) {
        const cube = manager.getCube(manager.mouseOverMesh)
        setCube(cube)
        setIsAwaitingClick(false)
        return true
      }
      return false
    }
    onMouseUp.addListener(900, mouseUpListener, { recieveWhenIndexBlocked: true })
    return () => onMouseUp.removeListener(mouseUpListener)
  }, [manager, isAwaitingClick, onMouseUp, setCube])

  const cubeButtonClicked = () => {
    if (isAwaitingClick) {
      setIsAwaitingClick(false)
      return
    }
    if (manager.selected.value.length === 0 || !allowInferedSelection) {
      setErrorMessage?.("")
      setIsAwaitingClick(true)
      return
    } else if (manager.selected.value.length === 1) {
      setErrorMessage?.("")
      const cube = project.model.identifierCubeMap.get(manager.selected.value[0])
      if (cube) {
        setCube(cube)
      } else {
        setErrorMessage?.("Cube not found")
        setIsAwaitingClick(true)
      }
    } else {
      setErrorMessage?.("Can only select one cube")
      setIsAwaitingClick(true)
      setCube(null)
    }
  }

  const cubeNamedTyped = (value: string) => {
    setTypedCubename(value)
    const cubesWithName = project.model.cubeMap.get(value)
    if (cubesWithName) {
      if (cubesWithName.length === 1) {
        cubesWithName.forEach(c => setCube(c))
        setErrorMessage?.("")
      } else {
        setErrorMessage?.("Too many cubes of that name")
        setCube(null)
      }
    } else {
      setErrorMessage?.("Cube not found")
      setCube(null)
    }
  }

  return (
    <>
      <div className="flex flex-grow flex-row">
        <input
          value={cube?.name?.value ?? typedCubeName}
          onInput={e => cubeNamedTyped(e.currentTarget.value)}
          className={"w-0 flex-grow dark:text-white ml-3 px-1 rounded h-6 " + (cube === null ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700")}
          type="text"
        />
        <button onClick={cubeButtonClicked} className={"group w-6 h-6 ml-3 flex justify-center items-center rounded " + (isAwaitingClick ? "bg-purple-500" : "bg-gray-500 hover:bg-blue-600")}>
          <SVGCube className="dark:text-white w-4 h-4" />
        </button>
      </div>
    </>
  )
}

export default CubeSelectionInputButton