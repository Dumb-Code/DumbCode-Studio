import { useEffect, useMemo } from 'react';
import { Event } from 'three';
import { useOptions } from '../../contexts/OptionsContext';
import { useStudio } from '../../contexts/StudioContext';
import { useChangingDelegateListenableObject } from '../listenableobject/ListenableObject';
import SelectedCubeUndoRedoHandler from '../undoredo/SelectedCubeUndoRedoHandler';

export const useSelectedCubeManager = (undoRedoHandler?: SelectedCubeUndoRedoHandler<any>) => {
  const { renderer, getSelectedProject, onFrameListeners, raycaster, getCamera, onMouseUp, transformControls } = useStudio()

  const dom = renderer.domElement
  const project = getSelectedProject()
  const { selectedCubeManager: cubeManager, model } = project

  const { unifiedSelectedCubes } = useOptions()

  useEffect(() => {
    if (undoRedoHandler) {
      cubeManager.activeUndoRedoHandler = undoRedoHandler
    }
    return () => {
      cubeManager.activeUndoRedoHandler = undefined
    }
  }, [undoRedoHandler, cubeManager])

  //Link together the active undoredo cube selection handler and the cube manager selection handler
  useChangingDelegateListenableObject(
    undoRedoHandler?.selectedCubes,
    cubeManager.selected,
    useMemo(() => [], []),
    unifiedSelectedCubes,
  )

  useEffect(() => {
    //When the transform controls are in use, block this
    const onMouseDownTransformControlBlocking = () => {
      return transformControls.dragging && transformControls.axis !== null
    }


    const onTransformControlsAxisHover = (e: Event) => {
      const value = e.value as string | null
      if (value === null) {
        //Also show tooltip
        cubeManager.disabled = false
        // callback()
      } else {
        //Also hide tooltip
        cubeManager.disabled = true
        if (cubeManager.mouseOverMesh !== null) {
          cubeManager.onMouseOffMesh(cubeManager.mouseOverMesh)
        }
      }
    }

    cubeManager.listeners.add(onMouseDownTransformControlBlocking)
    transformControls.addEventListener("axis-changed", onTransformControlsAxisHover)
    return () => {
      cubeManager.listeners.delete(onMouseDownTransformControlBlocking)
      transformControls.removeEventListener("axis-changed", onTransformControlsAxisHover)
    }
  }, [cubeManager, dom, raycaster, getCamera, model, onFrameListeners, project, onMouseUp, transformControls])
}