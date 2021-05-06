import { DCMModel, DCMCube } from './DcmModel';
import { useCallback, useEffect, useState } from 'react';
import { useStudio } from "../../../contexts/StudioContext"

export const useModelRootCubes: () => [ DCMModel, DCMCube[] ] = () => {
  const { selectedProject } = useStudio()

  const gatherChildren = useCallback(() => [...selectedProject.model.children], [selectedProject.model.children])

  const [children, setChildren] = useState(gatherChildren)

  useEffect(() => {
    if(selectedProject !== null) {
      const { model } = selectedProject
      const listener = () => {
        setChildren(gatherChildren())
      }
      model.addEventListener('hierarchyChanged', listener)
      return () => model.removeEventListener('hierarchyChanged', listener)
    }
  }, [selectedProject, gatherChildren])

  return [ selectedProject.model, children ]
}