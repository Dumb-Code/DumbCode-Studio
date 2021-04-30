import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Camera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DcProject from '../studio/formats/DcProject';

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

  selectedProject: DcProject|null,
  setSelectedProject: (project: DcProject) => void

} & ThreeJsContext
const StudioContext_ = createContext<StudioContext|null>(null);
export const useStudio = () => {
  const context = useContext(StudioContext_)
  if (context == null) {
    throw new Error(`useStudio must be used within a StudioContextProvider`)
  }
  return context
}

export const useRendererDomRef = <T extends HTMLElement,>() => {
  const { renderer, setSize } = useStudio()
  const ref = useRef<T>(null)

  useEffect(() => {
    if(ref.current == undefined) {
      throw new Error("Error: Ref is not set");
    }
    setSize(ref.current.offsetWidth, ref.current.clientHeight)
    ref.current.appendChild(renderer.domElement)
  }, [ref])

  return ref
}
export const StudioContextProvider = StudioContext_.Provider