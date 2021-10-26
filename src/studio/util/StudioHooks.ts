import { useMemo } from 'react';
import { useListenableObject } from './ListenableObject';
import { useStudio } from './../../contexts/StudioContext';

export const useTextureGroupSelect = () => {
  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()
  const [groups] = useListenableObject(project.textureManager.groups)
  const [selected, setSelected] = useListenableObject(project.textureManager.selectedGroup)
  return useMemo(() => groups.map(group => {
    return {
      group,
      selected: selected === group,
      setSelected: () => {
        setSelected(group)
      }
    }
  }), [groups, selected, setSelected])
}