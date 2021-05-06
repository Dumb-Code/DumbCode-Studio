import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Camera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DcProject, { newProject } from '../studio/formats/DcProject';
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
  addProject: (projects: DcProject) => void,

  selectedProject: DcProject,
  selectProject: (project: DcProject) => void

} & ThreeJsContext
const CreatedContext = createContext<StudioContext | null>(null);
export const useStudio = () => {
  const context = useContext(CreatedContext)
  if (context == null) {
    throw new Error(`useStudio must be used within a StudioContextProvider`)
  }
  return context
}

export const StudioContextProvider = ({ children }: { children?: ReactNode }) => {
  const three = useMemo(createThreeContext, [])

  const [projects, setProjects] = useState<DcProject[]>([])
  const [selectedProject, setSelectedProject] = useState(newProject)

  const context: StudioContext = {
    projects,
    addProject: project => {
      setProjects(projects.concat([project]))
      context.selectProject(project)
    },

    selectedProject,
    selectProject: project => {
      console.log(project, selectedProject)
      if (project !== selectedProject) {
        three.scene.remove(selectedProject.group)
        three.scene.add(project.group)
      }
      setSelectedProject(project)
    },

    ...three
  }

  return (
    <CreatedContext.Provider value={context}>
      {children}
    </CreatedContext.Provider>
  )
}