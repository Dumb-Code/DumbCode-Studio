import { BoxBufferGeometry, Camera, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, SphereBufferGeometry, Vector3 } from "three";
import { DCMCube, DCMModel } from '../formats/model/DcmModel';
import { scaleMeshToCamera } from '../util/Utils';

const tempPos = new Vector3()


const bufferBoxGeometry = new BoxBufferGeometry()
bufferBoxGeometry.applyMatrix4(new Matrix4().makeTranslation(0.5, 0.5, 0.5))

const outline = new LineSegments(new EdgesGeometry(bufferBoxGeometry), new LineBasicMaterial({ color: 0x0624cf }))
const pointer = new Mesh(new SphereBufferGeometry(1 / 32, 32, 32), new MeshBasicMaterial({ color: 0x0624cf }))

type CubeData = {
  cube: DCMCube,
  outline: typeof outline
  pointer: typeof pointer
  group: Group
}

export class CubeSelectedHighlighter {

  readonly cubeCache = new Map<string, CubeData>()

  private previouslySelected: readonly string[] = []

  constructor(
    readonly group: Group,
    readonly model: DCMModel
  ) { }

  onFrame(camera: Camera) {
    if (this.model.parentProject === undefined) {
      return
    }
    const selected = this.model.parentProject.selectedCubeManager.selected.value
    //As selected *should* be immutable, we can do a check here to see if it's changed.
    if (selected !== this.previouslySelected) {
      this.addAndRemoveData(selected)
      this.previouslySelected = selected
    }

    this.cubeCache.forEach(data => {
      data.pointer.position.setFromMatrixPosition(data.cube.cubeGroup.matrixWorld)
      scaleMeshToCamera(data.pointer, camera, 3)

      data.cube.cubeMesh.matrixWorld.decompose(data.outline.position, data.outline.quaternion, tempPos)
      data.outline.rotation.setFromQuaternion(data.outline.quaternion)
      data.outline.scale.copy(data.cube.cubeMesh.scale).divideScalar(16)

    })

  }

  private addAndRemoveData(selected: readonly string[]) {
    const toRemove = this.previouslySelected.filter(identif => !selected.includes(identif))
    const toAdd = selected.filter(identif => !this.previouslySelected.includes(identif))

    toRemove.forEach(identif => {
      const data = this.cubeCache.get(identif)
      if (data) {
        this.group.remove(data.group)
      }
      this.cubeCache.delete(identif)
    })
    toAdd.forEach(identif => {
      const cube = this.model.identifierCubeMap.get(identif)
      if (!cube) {
        return
      }

      const newOutline = outline.clone()
      const newPointer = pointer.clone()

      const newGroup = new Group()
      newGroup.add(newOutline)
      newGroup.add(newPointer)

      this.group.add(newGroup)

      this.cubeCache.set(identif, {
        cube,
        outline: newOutline,
        pointer: newPointer,
        group: newGroup
      })
    })

  }

}

