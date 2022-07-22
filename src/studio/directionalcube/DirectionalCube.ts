import { BoxBufferGeometry, Camera, Clock, Mesh, MeshBasicMaterial, NearestFilter, OrthographicCamera, Quaternion, Raycaster, Scene, TextureLoader, Vector2, Vector3, Vector4, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const tempVec2 = new Vector2()
const tempVec3 = new Vector3()
const tempVec4 = new Vector4()

const _tempVec = new Vector3()
const _tempVec2 = new Vector3()
const _tempVec3 = new Vector3()
const _tempVec4 = new Vector3()

const _tempQuat = new Quaternion()
const _tempQuat2 = new Quaternion()

const identityQuat = new Quaternion()
identityQuat.identity()

export class DirectionalCube {

  private static instance: DirectionalCube | undefined

  readonly scene = new Scene()

  readonly width = 75
  readonly height = 75

  readonly camera = new OrthographicCamera(-1, 1, 1, -1)

  readonly raycaster = new Raycaster()

  readonly transitionClock = new Clock()
  readonly transitionTime = 0.25;
  readonly startTarget = new Vector3()
  readonly transitionTarget = new Vector3()
  readonly rotationQuat = new Quaternion()
  readonly startOffset = new Vector3()
  startDistance = 0
  transitionDistance = 0

  readonly mainCube: Mesh<BoxBufferGeometry, MeshBasicMaterial[]>
  highlighedFace: number | null = null

  constructor() {
    setTimeout
    if (DirectionalCube.instance) {
      throw new Error('DirectionalCube is a singleton')
    }

    this.camera.zoom = 40
    this.camera.updateProjectionMatrix()

    const loader = new TextureLoader();
    loader.setPath('icons/cubefaces/');

    const textures = [
      'px.png', 'nx.png',
      'py.png', 'ny.png',
      'pz.png', 'nz.png'
    ].map(name => {
      const texture = loader.load(name)
      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter
      return texture
    });

    this.mainCube = new Mesh(new BoxBufferGeometry(0.025, 0.025, 0.025), textures.map(map => new MeshBasicMaterial({ map })))
    this.scene.add(this.mainCube)
  }

  static getInstance() {
    if (DirectionalCube.instance === undefined) {
      DirectionalCube.instance = new DirectionalCube()
    }
    return DirectionalCube.instance
  }

  private static updateFaceColour(selected: boolean) {
    const { mainCube, highlighedFace } = DirectionalCube.getInstance()
    if (highlighedFace !== null) {
      const mat = mainCube.material[highlighedFace]
      mat.color.set(selected ? 0x898989 : -1)
      mat.needsUpdate = true
    }
  }

  //X and Y are in the range [-1, 1], going over this scene
  static onMouseMove(x: number, y: number) {
    const instance = DirectionalCube.getInstance()
    const { raycaster, camera, scene, mainCube } = instance

    raycaster.setFromCamera(tempVec2.set(x, y), camera)
    const intersections = raycaster.intersectObject(mainCube)

    DirectionalCube.updateFaceColour(false)
    if (intersections.length !== 0 && x >= -1 && x <= 1 && y >= -1 && y <= 1) {
      const intersection = intersections[0]
      const { face } = intersection

      if (face) {
        instance.highlighedFace = face.materialIndex
      }
    } else {
      instance.highlighedFace = null
    }
    DirectionalCube.updateFaceColour(true)
  }

  static isHovered() {
    return DirectionalCube.getInstance().highlighedFace !== null
  }

  static performMouseClick(targetCamera: Camera, orbitControls: OrbitControls, rotationOnly: boolean) {
    const { highlighedFace } = DirectionalCube.getInstance()
    if (highlighedFace === null) {
      return false
    }
    switch (highlighedFace) {
      case 0:
        DirectionalCube.startTransition(targetCamera, orbitControls, 1, 0, 0, rotationOnly)
        break
      case 1:
        DirectionalCube.startTransition(targetCamera, orbitControls, -1, 0, 0, rotationOnly)
        break
      case 2:
        DirectionalCube.startTransition(targetCamera, orbitControls, 0, 1, 0, rotationOnly)
        break
      case 3:
        DirectionalCube.startTransition(targetCamera, orbitControls, 0, -1, 0, rotationOnly)
        break
      case 4:
        DirectionalCube.startTransition(targetCamera, orbitControls, 0, 0, 1, rotationOnly)
        break
      case 5:
        DirectionalCube.startTransition(targetCamera, orbitControls, 0, 0, -1, rotationOnly)
        break
    }
  }

  static startTransition(targetCamera: Camera, orbitControls: OrbitControls, x: number, y: number, z: number, rotationOnly = true) {
    const instance = DirectionalCube.getInstance()
    const { startTarget, transitionClock, transitionTarget, rotationQuat, startOffset } = instance
    const startPosition = _tempVec.copy(targetCamera.position)
    startTarget.copy(orbitControls.target)
    const startDistance = startPosition.distanceTo(startTarget)

    //The offsets from the target at the start and the end of the transition
    startOffset.subVectors(startPosition, startTarget).normalize()

    let endDistance: number
    let endOffset: Vector3
    if (rotationOnly) {
      //We want the end position to just be the target offset by xyz * distanceToTarget
      endDistance = startDistance
      endOffset = _tempVec2.set(x, y, z).multiplyScalar(startDistance).normalize()

      //The target doesn't move
      transitionTarget.set(0, 0, 0)

    } else {
      //If y is -1, then don't move the camera up 
      //Otherwise, we want to look at the "center" of the model (0.5, 1.5, 0.5)
      let yTarget = y < 0 ? 0 : 1.5

      //Set transition position to be the distance between the current camera and 5*xyz
      const endPosition = _tempVec2.set(x, y, z).multiplyScalar(5).add(tempVec3.set(0.5, yTarget, 0.5))
      const endTarget = _tempVec3.set(0.5, yTarget, 0.5)

      //As transition = end - start
      transitionTarget.subVectors(endTarget, startTarget)

      endDistance = endPosition.distanceTo(endTarget)
      endOffset = endPosition.sub(endTarget).normalize()
    }

    //We want to interpolate from startOffset to endOffset, going around a unit cirlce, then setting the distance to be 
    //The interpolation between startDistance and endDistance
    rotationQuat.setFromUnitVectors(startOffset, endOffset)

    const transitionDistance = endDistance - startDistance

    instance.startDistance = startDistance
    instance.transitionDistance = transitionDistance

    //Start the clock
    transitionClock.start()
  }

  static animateAt(cameraToFollow: Camera, orbitControls: OrbitControls, time: number) {
    const { startTarget, transitionTarget, rotationQuat, startDistance, transitionDistance, startOffset } = DirectionalCube.getInstance()

    const position = cameraToFollow.position.copy(startOffset)

    //Interpolate between no rotation and the rotationQuat
    //Then interpolate the distances
    position.applyQuaternion(_tempQuat.slerpQuaternions(identityQuat, rotationQuat, time))
    position.multiplyScalar(startDistance + transitionDistance * time)

    orbitControls.target.copy(transitionTarget).multiplyScalar(time).add(startTarget)
    position.add(orbitControls.target)

    orbitControls.update()
  }

  static render(cameraToFollow: Camera, orbitControls: OrbitControls, renderer: WebGLRenderer) {
    const { camera, width, height, scene, transitionClock, transitionTime } = DirectionalCube.getInstance()

    //If a transition is happeneing, move the camera
    if (transitionClock.running) {
      let d = transitionClock.getElapsedTime() / transitionTime
      if (d < 1) {
        DirectionalCube.animateAt(cameraToFollow, orbitControls, d)
        orbitControls.update()
      } else {
        DirectionalCube.animateAt(cameraToFollow, orbitControls, 0.9999) //We can't use 1 as the orbit controlls use lookAt, would then rotate weirly
        transitionClock.stop()
      }
    }

    //Set the camera to this camera position, and make it look at 0
    //as the camera is orthographic, it doesn't matter how far away it is
    cameraToFollow.getWorldDirection(camera.position)
    camera.position.multiplyScalar(-1)
    camera.lookAt(0, 0, 0)

    const viewport = renderer.getViewport(tempVec4)

    renderer.setViewport(viewport.width - width, 0, width, height)
    renderer.clearDepth()

    renderer.render(scene, camera)

    renderer.setViewport(viewport)
  }
}