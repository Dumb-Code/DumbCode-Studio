import { forwardRef, useImperativeHandle, useState } from "react"
import { useStudio } from "../contexts/StudioContext"
import { DCMCube } from "../studio/formats/model/DcmModel"

export type SelectedCubesRef = {
  getSelectedCubes(): readonly DCMCube[]
  clearSelectedCubes(): void
}

const SelectedCubesButton = forwardRef<SelectedCubesRef, { className?: string, butonClassName?: string, title: string }>(({ className, butonClassName, title }, ref) => {
  const [selectedCubes, setSelectedCubes] = useState<readonly DCMCube[]>([])

  useImperativeHandle(ref, () => ({
    getSelectedCubes: () => selectedCubes,
    clearSelectedCubes: () => setSelectedCubes([])
  }))

  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()

  const useSelected = () => {
    const selected = project.selectedCubeManager.selected.value
      .map(identif => project.model.identifierCubeMap.get(identif))
      .filter((cube): cube is DCMCube => cube !== undefined)

    setSelectedCubes(selected)
  }

  return (
    <div className={className + " rounded-sm"}>
      <p className="text-lg">{title}</p>
      <button className={butonClassName + " rounded-sm"} onClick={useSelected}>Use selected</button>
      <p className="overflow-ellipsis">Selected: {selectedCubes.map(s => s.name.value).join(", ")}</p>
    </div>
  )
})

export default SelectedCubesButton