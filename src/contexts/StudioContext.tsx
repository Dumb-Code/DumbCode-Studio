import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Camera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DcProject from '../studio/formats/DcProject';
import { createThreeContext } from './ThreeContext';

export type ThreeJsContext = {
  scene: Scene,
  onTopScene: Scene,
  renderer: WebGLRenderer,
  camera: Camera,
  controls: OrbitControls,

  setSize: (width: number, height: number) => void
  getSize: () => { width: number; height: number; }

  toggleGrid: () => void
  toggleBox: () => void
}
export type StudioContext = {
  projects: DcProject[],
  setProjects: (projects: DcProject[]) => void,

  selectedProject: DcProject | null,
  setSelectedProject: (project: DcProject) => void

} & ThreeJsContext
const CreatedContext = createContext<StudioContext | null>(null);
export const useStudio = () => {
  const context = useContext(CreatedContext)
  if (context == null) {
    throw new Error(`useStudio must be used within a StudioContextProvider`)
  }
  return context
}

export const StudioContextProvider = ({children}: {children?: ReactNode}) => {
  const three = useMemo(createThreeContext, [])

  const wrap = <T,>(func: (data: T, context: StudioContext) => void) => {
    return (data: T) => {
      const cloned = { ...context }
      func(data, cloned)
      setContext(cloned)
    }
  }

  const [context, setContext] = useState<StudioContext>(() => {
    return {
      selectedProject: null,
      setSelectedProject: wrap((data, context) => context.selectedProject = data),

      projects: [],
      setProjects: wrap((data, context) => context.projects = data),

      ...three
    }
  })

  return (
    <CreatedContext.Provider value={context}>
      {children}
    </CreatedContext.Provider>
  )
}