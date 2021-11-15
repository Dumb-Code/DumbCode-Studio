import { useEffect } from 'react';
import { BoxBufferGeometry, Camera, EventDispatcher, Group, Mesh, MeshLambertMaterial, OrthographicCamera, Quaternion, Raycaster, Vector3 } from "three";
import SelectedCubeManager from "../../../studio/util/SelectedCubeManager";
import { useStudio } from './../../../contexts/StudioContext';
import { DCMCube, DCMModel } from './../../../studio/formats/model/DcmModel';

const _defaultNormalColor = 0x23284d
const _defaultHighlightColor = 0x15c1d4

const visualGeometry = new BoxBufferGeometry(1 / 7, 1 / 7, 1 / 7);
const pickerGeometry = new BoxBufferGeometry(1 / 5, 1 / 5, 1 / 5);

const _defaultMaterial = new MeshLambertMaterial({ color: _defaultNormalColor })

type TrackedPoint = {
  x: number;
  y: number;
  z: number;
  mesh: Mesh<BoxBufferGeometry, MeshLambertMaterial>;
}

type Callback = (position: Vector3, point: TrackedPoint) => void

const tempPos = new Vector3()
const tempPos2 = new Vector3()
const tempQuaterion = new Quaternion()

const _enableEvent = { type: 'enable' }
const _disableEvent = { type: 'disable' }


export default class CubePointTracker extends EventDispatcher {

  public normalColor = _defaultNormalColor
  public highlightColor = _defaultHighlightColor

  private readonly points: TrackedPoint[] = []
  private readonly pickerPoints: Mesh<BoxBufferGeometry, MeshLambertMaterial>[] = []

  private enabled = false
  private intersected: Mesh<BoxBufferGeometry, MeshLambertMaterial> | null = null
  private definedCube: DCMCube | null = null //The cube to go to, instead of the first selected one
  private callback: Callback | null = null


  constructor(
    private readonly selectedCubeManager: SelectedCubeManager,
    private readonly model: DCMModel,
    group: Group,
  ) {
    super()
    //The points go in the range [0, 0.5, 1], with x=0.5,y=0.5,z=0.5 skipped, as it would be the center
    for (let x = 0; x <= 1; x += 0.5) {
      for (let y = 0; y <= 1; y += 0.5) {
        for (let z = 0; z <= 1; z += 0.5) {
          if (x === .5 && y === .5 && z === .5) {
            continue
          }

          //The visual mesh and picker mesh should share the material,
          //So updating the picker mesh material will update the visual mesh material.
          const material = _defaultMaterial.clone()

          const visualMesh = new Mesh(visualGeometry, material)
          visualMesh.visible = false
          group.add(visualMesh)

          const pickerMesh = new Mesh(pickerGeometry, material)
          pickerMesh.visible = false
          visualMesh.add(pickerMesh)
          this.pickerPoints.push(pickerMesh)


          const point: TrackedPoint = { x, y, z, mesh: visualMesh }
          pickerMesh.userData._point = point
          this.points.push(point)
        }
      }
    }
  }

  onMouseDown() {
    if (this.enabled) {
      let intersected = this.intersected
      if (intersected !== null && this.callback !== null) {
        if (intersected.parent !== null) {
          this.callback(intersected.parent.position, intersected.userData._point)
        }
      }
      this.disable()
      return true
    }
    return false
  }

  update(camera: Camera, raycaster: Raycaster) {
    const selected = this.selectedCubeManager.selected.value

    const mouseOverMesh = this.selectedCubeManager.mouseOverMesh
    const mouseOverCube = mouseOverMesh !== null ? this.selectedCubeManager.getCube(mouseOverMesh) : undefined

    let cubeToPointTo: DCMCube | undefined = undefined;
    if (this.definedCube !== null) {
      cubeToPointTo = this.definedCube
    } else if (mouseOverCube !== undefined) {
      cubeToPointTo = mouseOverCube
    } else if (selected.length === 1) {
      cubeToPointTo = this.model.identifierCubeMap.get(selected[0])
    }

    if (this.enabled && cubeToPointTo !== undefined) {
      const cube = cubeToPointTo

      const group = cube.cubeMesh

      //For each point, set the mesh visible and set the xyz position to the selected (or defined) cube.
      this.points.forEach(p => {
        p.mesh.visible = true

        //Gets the world position of where it should be
        const dimension = cube.dimension.value
        const cg = cube.cubeGrow.value

        tempPos.set(p.x * (dimension[0] + 2 * cg[0]) / 16, p.y * (dimension[1] + 2 * cg[1]) / 16, p.z * (dimension[2] + 2 * cg[2]) / 16).applyQuaternion(group.getWorldQuaternion(tempQuaterion))
        group.getWorldPosition(p.mesh.position).add(tempPos)

        group.getWorldQuaternion(p.mesh.quaternion)


        let factor;

        if (camera instanceof OrthographicCamera) {

          factor = (camera.top - camera.bottom) / camera.zoom;

        } else {
          //Used to have the mesh get smaller as it gets further away.
          //The angleBetween and cos is used to make it the right size even when not at the center of the screen
          tempPos2.subVectors(p.mesh.position, tempPos.setFromMatrixPosition(camera.matrixWorld)).normalize();
          let angleBetween = tempPos2.angleTo(camera.getWorldDirection(tempPos));
          factor = p.mesh.position.distanceTo(tempPos.setFromMatrixPosition(camera.matrixWorld)) * Math.cos(angleBetween);
        }

        p.mesh.scale.set(1, 1, 1).multiplyScalar(factor / 7);
      })

      //Raytrace under every helper point
      this.pickerPoints.forEach(p => p.visible = true)
      raycaster.setFromCamera(this.selectedCubeManager.mouse, camera)
      const intersected = raycaster.intersectObjects(this.pickerPoints, false)
      this.pickerPoints.forEach(p => p.visible = false)

      //If intersects any, get the first intersected point (closes).
      if (intersected.length > 0) {
        const closest = intersected[0].object as Mesh<BoxBufferGeometry, MeshLambertMaterial>

        //If doesn't equal the current intersected, set the current intersected color to normal, and set the color to highligghed
        if (this.intersected !== closest) {
          if (this.intersected !== null) {
            this.intersected.material.color.setHex(this.normalColor)
            this.intersected.material.needsUpdate = true
          }
          closest.material.color.setHex(this.highlightColor)
          closest.material.needsUpdate = true
          this.intersected = closest
        }

      } else if (this.intersected !== null) {
        //Nothing intersected. If the current intersected isn't null, reset the color and set it to null
        this.intersected.material.color.setHex(this.normalColor)
        this.intersected = null
      }
    } else {
      //Not enabled. Hide the meshes
      this.points.forEach(p => p.mesh.visible = false)
    }
  }

  enable(callback: Callback, normal = _defaultNormalColor, highlight = _defaultHighlightColor, definedCube: DCMCube | null = null) {
    this.enabled = true
    this.definedCube = definedCube
    this.callback = callback
    this.normalColor = normal
    this.highlightColor = highlight
    this.points.forEach(p => p.mesh.material.color.setHex(this.normalColor))
    this.dispatchEvent(_enableEvent)
  }

  disable() {
    this.enabled = false
    this.callback = null
    this.definedCube = null
    this.intersected = null
    this.dispatchEvent(_disableEvent)
  }
}

export const usePointTracking = () => {
  const { onMouseDown, onFrameListeners, getSelectedProject, getCamera, raycaster } = useStudio()
  const { cubePointTracker, modelerGumball } = getSelectedProject()

  useEffect(() => {
    const onMouseDownlistener = () => cubePointTracker.onMouseDown()
    const onFrameListener = () => cubePointTracker.update(getCamera(), raycaster)
    const onEnableEvent = () => {
      const reasons = modelerGumball.blockedReasons.value
      if (!reasons.includes("point_tracker")) {
        modelerGumball.blockedReasons.value = modelerGumball.blockedReasons.value.concat("point_tracker")
      }
    }
    const onDisableEvent = () => {
      const reasons = modelerGumball.blockedReasons.value
      if (reasons.includes("point_tracker")) {
        modelerGumball.blockedReasons.value = modelerGumball.blockedReasons.value.filter(v => v !== "point_tracker")
      }
    }
    onMouseDown.addListener(10, onMouseDownlistener)
    onFrameListeners.add(onFrameListener)
    cubePointTracker.addEventListener("enable", onEnableEvent)
    cubePointTracker.addEventListener("disable", onDisableEvent)
    return () => {
      onMouseDown.removeListener(onMouseDownlistener)
      onFrameListeners.delete(onFrameListener)
      cubePointTracker.removeEventListener("enable", onEnableEvent)
      cubePointTracker.removeEventListener("disable", onDisableEvent)
    }
  }, [onMouseDown, getCamera, cubePointTracker, onFrameListeners, raycaster, modelerGumball])
}