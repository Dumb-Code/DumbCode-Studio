import { useEffect } from "react";
import { Mesh, MeshLambertMaterial, Object3D, SphereBufferGeometry, Vector3 } from "three";
import { useStudio } from "../../../contexts/StudioContext";
import ShowcaseProperties from "../../../studio/showcase/ShowcaseProperties";
import { useListenableObject } from "../../../studio/util/ListenableObject";

export default class ShowcaseGumball {
  readonly transformAnchor = new Object3D()
  readonly visualAnchor = new Mesh(new SphereBufferGeometry(0.1, 8, 8), new MeshLambertMaterial({ color: 0xffffff }))

  constructor(
    readonly properties: ShowcaseProperties,
  ) {
    this.transformAnchor.rotation.order = "ZYX"
    this.transformAnchor.position.set(0.5, 0, 0.5)
    properties.group.add(this.transformAnchor)
  }
}


const tempVec3 = new Vector3()

export const useShowcaseGumball = () => {
  const { getSelectedProject, transformControls, onTopScene } = useStudio()
  const properties = getSelectedProject().showcaseProperties

  const [view] = useListenableObject(properties.selectedView)
  const [selectedLight] = useListenableObject(view.selectedLight)

  const gumball = properties.gumball

  useEffect(() => {
    if (selectedLight === null) {
      return
    }
    transformControls.attach(gumball.transformAnchor)
    transformControls.mode = "rotate"
    transformControls.space = "world"
    transformControls.enabled = true

    const objectChange = () => {
      tempVec3.set(0, 1, 0).applyQuaternion(gumball.transformAnchor.quaternion)
      selectedLight.direction.value = [tempVec3.x, tempVec3.y, tempVec3.z]
      gumball.visualAnchor.position.copy(tempVec3).add(gumball.transformAnchor.position)
    }

    const mouseDown = () => {
      gumball.transformAnchor.rotation.set(0, 0, 0)
      gumball.transformAnchor.updateMatrixWorld(true)
    }

    onTopScene.add(gumball.visualAnchor)
    transformControls.addEventListener("mouseDown", mouseDown)
    transformControls.addEventListener("objectChange", objectChange)

    return () => {
      transformControls.detach()
      transformControls.enabled = false
      transformControls.removeEventListener("mouseDown", mouseDown)
      transformControls.removeEventListener("objectChange", objectChange)
      onTopScene.remove(gumball.visualAnchor)
    }
  }, [transformControls, gumball, selectedLight, view, onTopScene])

}
