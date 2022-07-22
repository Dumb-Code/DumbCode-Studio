import { useEffect, useMemo } from 'react';
import { useKeyComboPressed } from '../../contexts/OptionsContext';
import { useStudio } from "../../contexts/StudioContext";
import { DirectionalCube } from './DirectionalCube';

export const useDirectionalCube = () => {
  const { getCamera, renderer, onRenderListeners, getSize, onMouseUp, controls } = useStudio()

  useKeyComboPressed(useMemo(() => ({
    camera_view: {
      front_view: () => DirectionalCube.startTransition(getCamera(), controls, 0, 0, -1),
      back_view: () => DirectionalCube.startTransition(getCamera(), controls, 0, 0, 1),

      left_view: () => DirectionalCube.startTransition(getCamera(), controls, -1, 0, 0),
      right_view: () => DirectionalCube.startTransition(getCamera(), controls, 1, 0, 0),

      top_view: () => DirectionalCube.startTransition(getCamera(), controls, 0, 1, 0),
      bottom_view: () => DirectionalCube.startTransition(getCamera(), controls, 0, -1, 0),
    }
  }), [getCamera, controls]))

  useEffect(() => {

    const onMouseMove = (event: MouseEvent) => {
      //Convert the mouse position to [-1, 1] of the bottom right segment of the canvas, where the diretional cube is
      const { width, height } = DirectionalCube.getInstance()
      const { width: canvasWidth, height: canvasHeight } = getSize()
      const { offsetX, offsetY } = event

      const x = 2 * (offsetX - canvasWidth) / width + 1
      const y = -2 * (offsetY - canvasHeight) / height - 1

      DirectionalCube.onMouseMove(x, y)
    }

    const runOnMouseUp = () => DirectionalCube.onMouseUp(getCamera(), controls)

    const onFrame = () => {
      DirectionalCube.render(getCamera(), controls, renderer)
    }
    onRenderListeners.add(onFrame)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    onMouseUp.addListener(0, runOnMouseUp)
    return () => {
      onRenderListeners.delete(onFrame)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      onMouseUp.removeListener(runOnMouseUp)
    }
  }, [getCamera, controls, renderer, onRenderListeners, getSize, onMouseUp])
}