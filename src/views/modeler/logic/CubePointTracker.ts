import { useEffect } from 'react';
import { BoxBufferGeometry, Camera, EventDispatcher, Group, Mesh, MeshLambertMaterial, Object3D, OrthographicCamera, Vector3 } from "three";
import { setIntersectType } from '../../../studio/util/ObjectClickedHook';
import SelectedCubeManager from "../../../studio/util/SelectedCubeManager";
import { useStudio } from './../../../contexts/StudioContext';
import { DCMCube, DCMModel } from './../../../studio/formats/model/DcmModel';
import { setIntersectThrogh } from './../../../studio/util/ObjectClickedHook';

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
  pickerMesh: Mesh<BoxBufferGeometry, MeshLambertMaterial>;
}

type TrackersForCube = {
  group: Group;
  points: TrackedPoint[];
}

type Callback = (position: Vector3, point: TrackedPoint, cube: DCMCube) => void

const tempPos = new Vector3()
const tempPos2 = new Vector3()

const _enableEvent = { type: 'enable' }
const _disableEvent = { type: 'disable' }


export default class CubePointTracker extends EventDispatcher {

  public normalColor = _defaultNormalColor
  public highlightColor = _defaultHighlightColor

  private readonly trackers: TrackersForCube[] = []

  private enabled = false
  private cubesToPointTo: readonly DCMCube[] = []
  private intersected: Mesh<BoxBufferGeometry, MeshLambertMaterial> | null = null
  private callback: Callback | null = null



  constructor(
    private readonly selectedCubeManager: SelectedCubeManager,
    private readonly model: DCMModel,
    private readonly group: Group,
  ) {
    super()
  }

  private createGroup() {
    const group = new Group()
    const points: TrackedPoint[] = []

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
          group.add(visualMesh)

          const pickerMesh = new Mesh(pickerGeometry, material)
          visualMesh.add(pickerMesh)

          material.color.setHex(this.normalColor)
          material.needsUpdate = true

          const point: TrackedPoint = { x, y, z, mesh: visualMesh, pickerMesh }
          pickerMesh.userData._point = point
          setIntersectType(pickerMesh, "pointtracker", () => this.enabled)
          setIntersectThrogh(pickerMesh, true)
          points.push(point)
        }
      }
    }
    group.visible = false
    this.group.add(group)

    const ret = { group, points }
    this.trackers.push(ret)
    return ret
  }

  onMouseUp() {
    //If we click on a cube, but not a point, ignore the click
    if (this.selectedCubeManager.mouseOverMesh !== null && this.intersected === null) {
      return
    }
    if (this.enabled) {
      let intersected = this.intersected
      const { callback } = this
      this.disable()
      if (intersected !== null && intersected.userData._cube instanceof DCMCube && callback !== null) {
        if (intersected.parent !== null) {
          callback(intersected.parent.position, intersected.userData._point, intersected.userData._cube)
        }
      }
      return true
    }
    return false
  }

  update(camera: Camera, intersectedObject?: Object3D) {
    const selected = this.selectedCubeManager.selected.value

    const mouseOverMesh = this.selectedCubeManager.mouseOverMesh
    const mouseOverCube = mouseOverMesh !== null ? this.selectedCubeManager.getCube(mouseOverMesh) : undefined

    this.cubesToPointTo = []
    if (selected.length !== 0) {
      this.cubesToPointTo = this.model.identifListToCubes(selected)
    } else if (mouseOverCube !== undefined) {
      this.cubesToPointTo = [mouseOverCube]
    }

    //Ensure there is enough trackers for the number of cubes to point to
    while (this.trackers.length < this.cubesToPointTo.length) {
      this.createGroup()
    }

    //Hide the trackers that aren't used
    for (let i = this.cubesToPointTo.length; i < this.trackers.length; i++) {
      this.trackers[i].group.visible = false
    }

    if (this.enabled) {
      //For each point, set the mesh visible and set the xyz position to the selected (or defined) cube.
      this.cubesToPointTo.forEach((cube, index) => {
        const { group: trackerGroup, points } = this.trackers[index]
        trackerGroup.visible = true

        const cubeMesh = cube.cubeMesh

        points.forEach(p => {
          p.pickerMesh.userData._cube = cube

          //Gets the world position of where it should be
          const dimension = cube.dimension.value
          const cg = cube.cubeGrow.value

          const worldQuat = cubeMesh.getWorldQuaternion(p.mesh.quaternion)

          tempPos.set(p.x * (dimension[0] + 2 * cg[0]) / 16, p.y * (dimension[1] + 2 * cg[1]) / 16, p.z * (dimension[2] + 2 * cg[2]) / 16).applyQuaternion(worldQuat)
          cubeMesh.getWorldPosition(p.mesh.position).add(tempPos)


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
      })

      // //Raytrace under every helper point
      // this.pickerPoints.forEach(p => p.visible = true)
      // raycaster.setFromCamera(this.selectedCubeManager.mouse, camera)
      // const intersected = raycaster.intersectObjects(this.pickerPoints, false)
      // this.pickerPoints.forEach(p => p.visible = false)

      //If intersects any, get the first intersected point (closes).
      if (intersectedObject instanceof Mesh) {
        const closest = intersectedObject as Mesh<BoxBufferGeometry, MeshLambertMaterial>

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
      this.trackers.forEach(p => {
        p.group.visible = false
        p.points.forEach(p => p.pickerMesh.userData._cube = null)
      })
    }

  }

  enable(callback: Callback, normal = _defaultNormalColor, highlight = _defaultHighlightColor) {
    this.enabled = true
    this.callback = callback
    this.normalColor = normal
    this.highlightColor = highlight
    this.trackers.flatMap(t => t.points).forEach(p => p.mesh.material.color.setHex(this.normalColor))
    this.dispatchEvent(_enableEvent)
  }

  disable() {
    this.enabled = false
    this.callback = null
    this.intersected = null
    this.dispatchEvent(_disableEvent)
  }
}

export const usePointTracking = () => {
  const { onMouseUp, onFrameListeners, getSelectedProject, raycaster } = useStudio()
  const { cubePointTracker, modelerGumball } = getSelectedProject()

  useEffect(() => {
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
    cubePointTracker.addEventListener("enable", onEnableEvent)
    cubePointTracker.addEventListener("disable", onDisableEvent)
    return () => {
      cubePointTracker.removeEventListener("enable", onEnableEvent)
      cubePointTracker.removeEventListener("disable", onDisableEvent)
    }
  }, [onMouseUp, cubePointTracker, onFrameListeners, raycaster, modelerGumball])
}