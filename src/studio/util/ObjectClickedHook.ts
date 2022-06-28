import { useEffect, useRef } from 'react';
import { Object3D } from 'three';
import { useStudio } from './../../contexts/StudioContext';

const validTypes = ["cube", "refimg", "pointtracker"] as const
const typeKey = "dumbcode_intersect_type"
const intersectThrough = "dumbcode_intersect_through"
const visibleKey = "dumbcode_visible_key"

export const setIntersectType = (object: Object3D, type: typeof validTypes[number], enabled?: () => boolean) => {
  object.userData[typeKey] = type
  if (enabled) {
    object.userData[visibleKey] = enabled
  }
}

export const setIntersectThrogh = (object: Object3D, through: boolean) => {
  object.userData[intersectThrough] = through
}

export const useObjectUnderMouse = () => {
  const { renderer, getSelectedProject, getCamera, raycaster, onFrameListeners, onMouseUp } = useStudio()
  const project = getSelectedProject()
  const { selectionGroup, selectedCubeManager, cubePointTracker, referenceImageHandler } = project
  const mouseDownRef = useRef(false)
  const mouse = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onFrame = () => {
      //If the mouse is down, or the mouse is outside the canvas viewspace, then ignore
      if (mouseDownRef.current || Math.abs(mouse.current.x) > 1 || Math.abs(mouse.current.y) > 1) {
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

      if (intersected.length === 0) {
        selectedCubeManager.update(undefined)
        cubePointTracker.update(getCamera(), undefined)
        referenceImageHandler.update(undefined)
      } else {
        const intersectedData: Partial<Record<typeof validTypes[number], Object3D>> = {}

        for (const i of intersected) {
          const object = i.object
          const type = object.userData[typeKey]
          if (type === "cube" && intersectedData.cube === undefined) {
            intersectedData.cube = object
          } else if (type === "refimg" && intersectedData.refimg === undefined) {
            intersectedData.refimg = object
          } else if (type === "pointtracker" && intersectedData.pointtracker === undefined) {
            intersectedData.pointtracker = object
          }
          if (!object.userData[intersectThrough]) {
            break
          }
        }

        selectedCubeManager.update(intersectedData.cube)
        cubePointTracker.update(getCamera(), intersectedData.pointtracker)
        referenceImageHandler.update(intersectedData.refimg)
      }

    }

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY
      const rect = renderer.domElement.getBoundingClientRect()

      mouse.current.x = ((x - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = - ((y - rect.top) / rect.height) * 2 + 1;


      //Mouse is up, ensure that the mouseDownRef is false
      if ((e.buttons & 1) === 0) {
        mouseUpAnywhere()
      }
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