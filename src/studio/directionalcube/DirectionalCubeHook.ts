import { useEffect, useMemo } from 'react';
import { useKeyComboPressed } from '../../contexts/OptionsContext';
import { useStudio } from "../../contexts/StudioContext";
import { useKeyComboUnknownEventMatcher } from './../../contexts/OptionsContext';
import { DirectionalCube } from './DirectionalCube';

export const useDirectionalCube = () => {
  const { getCamera, renderer, onRenderListeners, getSize, onMouseUp, controls } = useStudio()

  const { reset_camera_on_click: shouldResetCamera } = useKeyComboUnknownEventMatcher("camera_view")

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

    const onMouseDown = (event: MouseEvent) => {
      if (!DirectionalCube.isHovered()) {
        return
      }
      DirectionalCube.performMouseClick(getCamera(), controls, !shouldResetCamera(event))

      event.stopImmediatePropagation()
      event.stopPropagation()
    }

    //Ensure that stuff cannot be clicked through the directional cube
    const stopMouseUpIfHovered = () => DirectionalCube.isHovered()

    const onFrame = () => {
      DirectionalCube.render(getCamera(), controls, renderer)
    }
    onRenderListeners.add(onFrame)
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    //We want to capture, as we want to get it BEFORE other event listneres
    renderer.domElement.addEventListener('mousedown', onMouseDown, { capture: true })

    //Use a weight of 0 so it's the first event listener
    onMouseUp.addListener(0, stopMouseUpIfHovered)
    return () => {
      onRenderListeners.delete(onFrame)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mousedown', onMouseDown, { capture: true })
      onMouseUp.removeListener(stopMouseUpIfHovered)
    }
  }, [getCamera, controls, renderer, onRenderListeners, getSize, onMouseUp, shouldResetCamera])
}