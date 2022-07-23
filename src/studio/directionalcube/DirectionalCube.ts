import { BoxBufferGeometry, Camera, Clock, Mesh, MeshBasicMaterial, NearestFilter, Object3D, OrthographicCamera, PlaneBufferGeometry, Quaternion, Raycaster, Scene, TextureLoader, Vector2, Vector3, Vector4, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const tempVec3 = new Vector3()
const tempVec4 = new Vector4()

const _tempVec = new Vector3()
const _tempVec2 = new Vector3()
const _tempVec3 = new Vector3()

const _tempQuat = new Quaternion()

const identityQuat = new Quaternion()
identityQuat.identity()

const transitionKey = "directionalcube-transition"
const setTransition = (mesh: Object3D, x: number, y: number, z: number) => {
  mesh.userData[transitionKey] = { x, y, z }
}
const getTransition = (mesh: Object3D): { x: number, y: number, z: number } | undefined => {
  return mesh.userData[transitionKey]
}

export class DirectionalCube {

  private static instance: DirectionalCube | undefined

  readonly scene = new Scene()

  readonly mouse = new Vector2()

  readonly width = 100
  readonly height = 100

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

  startZoom = 0
  transitionZoom = 0

  highlightedMesh: Mesh<any, MeshBasicMaterial | MeshBasicMaterial[]> | null = null
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

    const cubeSize = 0.025
    const mainCube = new Mesh(new BoxBufferGeometry(cubeSize, cubeSize, cubeSize), textures.map(map => new MeshBasicMaterial({ map })))
    this.scene.add(mainCube)

    const edgeSize = cubeSize / 5
    const clippedCubeSize = cubeSize - edgeSize * 2 //The size of the edges with the corners removed
    const movementAmount = (cubeSize - edgeSize) / 2 + 0.0001 //The 0.001 is to make it so it fully overlaps the edge, otherwise theres a single pixel gap

    const addFaceEdges = (x: number, y: number, z: number, xRot: number, yRot: number, zRot: number) => {
      const index = x !== 0 ? 0 : y !== 0 ? 1 : 2
      const nextAxis = (index + 1) % 3
      const previousAxis = (index + 2) % 3

      for (let edge = 0; edge < 4; edge++) {
        const isOdd = edge % 2 === 1
        const edgeGeometry = new PlaneBufferGeometry(isOdd ? edgeSize : clippedCubeSize, isOdd ? clippedCubeSize : edgeSize)
        const edgeMaterial = new MeshBasicMaterial({ visible: false, transparent: true, opacity: 0.75 })
        const edgeMesh = new Mesh(edgeGeometry, edgeMaterial)
        edgeMesh.position.set(
          //The 0.0001 is to prevent z-fighting
          x * cubeSize / 2 + 0.0001 * Math.sign(x),
          y * cubeSize / 2 + 0.0001 * Math.sign(y),
          z * cubeSize / 2 + 0.0001 * Math.sign(z)
        )

        //The way this ordering works, for each cube face, the edges are in the following order:
        // 0: Next axis positive. X goes to +y, Y goes to +z, Z goes to +x
        // 1: Previous axis positive. X goes to +z, Y goes to +x, Z goes to +y
        // 2: Next axis negative. X goes to -y, Y goes to -z, Z goes to -x
        // 3: Previous axis negative. X goes to -z, Y goes to -x, Z goes to -y
        const offset = [0, 0, 0]
        const chosenIndex = isOdd ? previousAxis : nextAxis
        offset[chosenIndex] = edge < 2 ? movementAmount : -movementAmount

        edgeMesh.position.x += offset[0]
        edgeMesh.position.y += offset[1]
        edgeMesh.position.z += offset[2]

        edgeMesh.rotation.set(xRot, yRot, zRot)

        setTransition(edgeMesh,
          x + Math.sign(offset[0]),
          y + Math.sign(offset[1]),
          z + Math.sign(offset[2])
        )

        this.scene.add(edgeMesh)
      }
    }

    addFaceEdges(0, 1, 0, -Math.PI / 2, 0, 0)
    addFaceEdges(0, -1, 0, Math.PI / 2, 0, 0)
    addFaceEdges(0, 0, 1, 0, 0, -Math.PI / 2)
    addFaceEdges(0, 0, -1, 0, Math.PI, Math.PI / 2)
    addFaceEdges(1, 0, 0, 0, Math.PI / 2, 0)
    addFaceEdges(-1, 0, 0, 0, -Math.PI / 2, 0)


    const addCorner = (x: number, y: number, z: number) => {
      const cornerGeometry = new BoxBufferGeometry(edgeSize, edgeSize, edgeSize)
      const cornerMaterial = new MeshBasicMaterial({ visible: false, transparent: true, opacity: 0.75 })
      const cornerMesh = new Mesh(cornerGeometry, cornerMaterial)
      cornerMesh.position.set(
        x * cubeSize / 2 + (0.0001 - edgeSize / 2) * Math.sign(x),
        y * cubeSize / 2 + (0.0001 - edgeSize / 2) * Math.sign(y),
        z * cubeSize / 2 + (0.0001 - edgeSize / 2) * Math.sign(z)
      )
      setTransition(cornerMesh, x, y, z)
      this.scene.add(cornerMesh)
    }
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          addCorner(x, y, z)
        }
      }
    }
  }

  static getInstance() {
    if (DirectionalCube.instance === undefined) {
      DirectionalCube.instance = new DirectionalCube()
    }
    return DirectionalCube.instance
  }

  private static updateFaceColour(selected: boolean) {
    const { highlightedMesh, highlighedFace, scene } = DirectionalCube.getInstance()
    if (highlightedMesh !== null && highlighedFace !== null) {
      if (Array.isArray(highlightedMesh.material)) {
        const mat = highlightedMesh.material[highlighedFace]
        mat.color.set(selected ? 0x898989 : -1)
        mat.needsUpdate = true
      } else {
        const transition = getTransition(highlightedMesh)
        if (!transition) {
          return
        }
        //Get all the objects with the same transition, and update their colour
        const mats = scene.children.filter((child): child is Mesh<any, MeshBasicMaterial> => {
          const childTransition = getTransition(child)
          return childTransition !== undefined &&
            childTransition.x === transition.x &&
            childTransition.y === transition.y &&
            childTransition.z === transition.z &&
            child instanceof Mesh &&
            !Array.isArray(child.material)
        }).map(child => child.material)

        mats.forEach(mat => {
          mat.color.set(selected ? 0x898989 : -1)
          mat.visible = selected
          mat.needsUpdate = true
        })
      }
    }
  }

  //X and Y are in the range [-1, 1], going over this scene
  static onMouseMove(x: number, y: number) {
    DirectionalCube.getInstance().mouse.set(x, y)
    DirectionalCube.updateMouse()
  }

  static updateMouse() {
    const instance = DirectionalCube.getInstance()
    const { raycaster, camera, scene, mouse } = instance

    const { x, y } = mouse

    raycaster.setFromCamera(mouse, camera)
    const intersections = raycaster.intersectObject(scene)

    DirectionalCube.updateFaceColour(false)
    if (intersections.length !== 0 && x >= -1 && x <= 1 && y >= -1 && y <= 1) {
      const intersection = intersections[0]
      const { face, object } = intersection

      instance.highlighedFace = face ? face.materialIndex : null
      instance.highlightedMesh = object as Mesh<any, MeshBasicMaterial | MeshBasicMaterial[]>
    } else {
      instance.highlighedFace = null
      instance.highlightedMesh = null
    }
    DirectionalCube.updateFaceColour(true)
  }

  static isHovered() {
    return DirectionalCube.getInstance().highlightedMesh !== null
  }

  static performMouseClick(targetCamera: Camera, orbitControls: OrbitControls, rotationOnly: boolean) {
    const { highlightedMesh, highlighedFace } = DirectionalCube.getInstance()
    if (highlightedMesh === null) {
      return false
    }
    const transition = getTransition(highlightedMesh)
    if (transition !== undefined) {
      DirectionalCube.startTransition(targetCamera, orbitControls, transition.x, transition.y, transition.z, rotationOnly)
      return true
    }
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

    instance.startZoom = -1
    instance.transitionZoom = -1

    const transition = _tempVec2.set(x, y, z).normalize()

    let endDistance: number
    let endOffset: Vector3
    if (rotationOnly) {
      //We want the end position to just be the target offset by xyz * distanceToTarget
      endDistance = startDistance
      endOffset = transition.multiplyScalar(startDistance).normalize()

      //The target doesn't move
      transitionTarget.set(0, 0, 0)

    } else {
      //If y is -1, then don't move the camera up 
      //Otherwise, we want to look at the "center" of the model (0.5, 1.5, 0.5)
      let yTarget = y < 0 ? 0 : 1.5

      //Set transition position to be the distance between the current camera and 5*xyz
      const endPosition = transition.multiplyScalar(5).add(tempVec3.set(0.5, yTarget, 0.5))
      const endTarget = _tempVec3.set(0.5, yTarget, 0.5)

      //As transition = end - start
      transitionTarget.subVectors(endTarget, startTarget)

      endDistance = endPosition.distanceTo(endTarget)
      endOffset = endPosition.sub(endTarget).normalize()

      if (targetCamera instanceof OrthographicCamera) {
        instance.startZoom = targetCamera.zoom
        instance.transitionZoom = 1 - instance.startZoom //1 is the end zoom target
      }
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
    const { startTarget, transitionTarget, rotationQuat, startDistance, transitionDistance, startOffset, startZoom, transitionZoom } = DirectionalCube.getInstance()

    const position = cameraToFollow.position.copy(startOffset)

    //Interpolate between no rotation and the rotationQuat
    //Then interpolate the distances
    position.applyQuaternion(_tempQuat.slerpQuaternions(identityQuat, rotationQuat, time))
    position.multiplyScalar(startDistance + transitionDistance * time)

    orbitControls.target.copy(transitionTarget).multiplyScalar(time).add(startTarget)
    position.add(orbitControls.target)

    if (cameraToFollow instanceof OrthographicCamera && startZoom !== -1 && transitionZoom !== -1) {
      cameraToFollow.zoom = startZoom + transitionZoom * time
      cameraToFollow.updateProjectionMatrix()
    }

    orbitControls.update()
  }

  static render(cameraToFollow: Camera, orbitControls: OrbitControls, renderer: WebGLRenderer) {
    const { camera, width, height, scene, transitionClock, transitionTime } = DirectionalCube.getInstance()

    DirectionalCube.updateMouse()

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