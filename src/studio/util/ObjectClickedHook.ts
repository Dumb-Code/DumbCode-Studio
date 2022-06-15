import { useEffect, useRef } from 'react';
import { Object3D } from 'three';
import { useStudio } from './../../contexts/StudioContext';

const validTypes = ["cube", "refimg", "pointtracker"] as const
const typeKey = "dumbcode_intersect_type"
const visibleKey = "dumbcode_visible_key"

export const setIntersectType = (object: Object3D, type: typeof validTypes[number], enabled?: () => boolean) => {
  object.userData[typeKey] = type
  if (enabled) {
    object.userData[visibleKey] = enabled
  }
}

export const useObjectUnderMouse = () => {
  const { renderer, getSelectedProject, getCamera, raycaster, onFrameListeners, onMouseUp } = useStudio()
  const project = getSelectedProject()
  const { selectionGroup, selectedCubeManager, cubePointTracker, referenceImageHandler } = project
  const mouseDownRef = useRef(false)
  const mouse = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onFrame = () => {
      if (mouseDownRef.current) {
        return
      }
      const objects: Object3D[] = []
      selectionGroup.traverse(o => {
        const vis = o.userData[visibleKey]
        if (o.userData[typeKey] && (vis === undefined || vis())) {
          objects.push(o)
        }
      })

      raycaster.setFromCamera(mouse.current, getCamera())
      const intersected = raycaster.intersectObjects(objects, false)
      const object = intersected.length !== 0 ? intersected[0].object : undefined
      const type = object?.userData?.[typeKey]

      if (type !== undefined && !validTypes.includes(type)) {
        throw new Error(`Type ${type} is not valid`)
      }

      const t = type as typeof validTypes[number]

      selectedCubeManager.update(t === "cube" ? object : undefined)
      cubePointTracker.update(getCamera(), t === "pointtracker" ? object : undefined)
      referenceImageHandler.update(t === "refimg" ? object : undefined)
    }

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY
      const rect = renderer.domElement.getBoundingClientRect()

      mouse.current.x = ((x - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = - ((y - rect.top) / rect.height) * 2 + 1;
    }

    const mouseDown = () => mouseDownRef.current = true
    const mouseUpAnywhere = () => mouseDownRef.current = false

    const mouseUpCanvas = (e: React.MouseEvent) => {
      selectedCubeManager.onMouseUpOnCanvas(project, e.ctrlKey)
      cubePointTracker.onMouseUp()
      referenceImageHandler.onMouseUp()
      return false
    }

    onFrameListeners.add(onFrame)
    onMouseUp.addListener(999, mouseUpCanvas)
    document.addEventListener("pointermove", onMouseMove)
    document.addEventListener("pointerdown", mouseDown)
    document.addEventListener("pointerup", mouseUpAnywhere, true)
    return () => {
      onFrameListeners.delete(onFrame)
      onMouseUp.removeListener(mouseUpCanvas)
      document.removeEventListener("pointermove", onMouseMove)
      document.removeEventListener("pointerdown", mouseDown)
      document.removeEventListener("pointerup", mouseUpAnywhere, true)
    }
  }, [cubePointTracker, getCamera, onFrameListeners, onMouseUp, project, raycaster, renderer, referenceImageHandler, selectedCubeManager, selectionGroup])
}