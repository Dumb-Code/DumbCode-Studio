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

  hasProject: boolean
  getSelectedProject: () => DcProject
  selectedProject: DcProject,
  selectProject: (project: DcProject) => void,
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
  const [selectedProject, setSelectedProject] = useState<DcProject|null>(null)

  const context: StudioContext = {
    projects,
    addProject: project => {
      setProjects(projects.concat([project]))
      context.selectProject(project)
    },

    hasProject: selectedProject !== null,
    get selectedProject() { return context.getSelectedProject() },
    getSelectedProject: () => {
      if(selectedProject === null) {
        const project = newProject()
        context.addProject(project)
        return project
      }
      return selectedProject
    },

    selectProject: project => {
      if (project !== selectedProject) {
        if(selectedProject !== null) {
          three.scene.remove(selectedProject.group)
        }
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