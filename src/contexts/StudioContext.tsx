import React from 'react';
import { Camera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DcProject from '../studio/formats/DcProject';

export type ThreeJsContext = {
  scene: Scene,
  onTopScene: Scene,
  renderer: WebGLRenderer,
  camera: Camera,
  controls: OrbitControls,
}
export type StudioContext = {
  projects: DcProject[],
  setProjects: (projects: DcProject[]) => void,

  selectedProject: DcProject|null,
  setSelectedProject: (project: DcProject) => void

} & ThreeJsContext
const StudioContext_ = React.createContext<StudioContext|null>(null);
export const useStudio = () => {
  const context = React.useContext(StudioContext_)
  if (context == null) {
    throw new Error(`useStudio must be used within a StudioContextProvider`)
  }
  return context
}
export const StudioContextProvider = StudioContext_.Provider