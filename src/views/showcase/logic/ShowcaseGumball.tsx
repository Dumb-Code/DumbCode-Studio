import { Mesh, MeshLambertMaterial, Object3D, SphereBufferGeometry } from "three";
import ShowcaseProperties from "../../../studio/showcase/ShowcaseProperties";

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




