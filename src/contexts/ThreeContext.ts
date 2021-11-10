import { AmbientLight, BoxBufferGeometry, Camera, Clock, Color, CylinderBufferGeometry, DirectionalLight, Group, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, Raycaster, REVISION, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import IndexedEventHandler from '../studio/util/WeightedEventHandler';

export type ThreeJsContext = {
  scene: Scene,
  onTopScene: Scene,
  renderer: WebGLRenderer,
  camera: Camera,
  controls: OrbitControls,
  raycaster: Raycaster,
  onMouseDown: IndexedEventHandler<React.MouseEvent>
  onFrameListeners: Set<(deltaTime: number) => void>,

  setSize: (width: number, height: number) => void
  getSize: () => { width: number; height: number; }

  toggleGrid: () => void
  toggleBox: () => void

  setGridColor: (majorColor: number, minorColor: number, subColor: number) => void
}

export const createThreeContext: () => ThreeJsContext = () => {
  console.log(`Creating ThreeJs (${REVISION}) Context`)
  //Set up the renderer
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  //Set up the camera
  const camera: Camera = new PerspectiveCamera(65, 1, 0.1, 700)
  camera.position.set(0.45, 1.5, 4.5)
  camera.lookAt(0.5, 1.5, 0.5)

  const scene = createScene()

  const onTopScene = createScene()
  onTopScene.background = null;

  //Set up the controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.5, 0, 0.5)
  controls.screenSpacePanning = true
  controls.update()

  const raycaster = new Raycaster()

  const onMouseDown = new IndexedEventHandler<React.MouseEvent>()

  const { grid, majorGridMaterial, minorGridMaterial, subGridMaterial } = createGrid()
  scene.add(grid)

  const box = createBox()
  scene.add(box)

  let width = 100
  let height = 100

  const clock = new Clock()

  const onFrameListeners = new Set<(deltaTime: number) => void>()

  const onFrame = () => {
    requestAnimationFrame(onFrame)

    const deltaTime = clock.getDelta()
    onFrameListeners.forEach(l => l(deltaTime))

    renderer.render(scene, camera)

    renderer.clearDepth()
    renderer.render(onTopScene, camera)
  }

  onFrame()

  return {
    renderer, camera, scene, onTopScene, controls,
    raycaster, onMouseDown, onFrameListeners,

    setSize: (w, h) => {
      width = w
      height = h
      renderer.setSize(width, height)

      if (camera instanceof PerspectiveCamera) {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      } else {
        // (camera as OrthographicCamera) TODO::
      }
    },

    getSize: () => {
      return { width, height }
    },

    toggleBox: () => box.visible = !box.visible,
    toggleGrid: () => grid.visible = !grid.visible,

    setGridColor: (majorColor, minorColor, subColor) => {
      majorGridMaterial.color.set(majorColor)
      minorGridMaterial.color.set(minorColor)
      subGridMaterial.color.set(subColor)
    }
  }
}

const createScene = () => {
  //Set up the Scene
  let scene = new Scene();
  scene.background = new Color(0x363636);

  //Set up lighting
  scene.add(new AmbientLight(0xffffff))

  let createLight = (x: number, y: number, z: number, i: number) => {
    let light = new DirectionalLight()
    light.position.set(x, y, z)
    light.intensity = i
    scene.add(light)
  }

  createLight(1, 0, 0, 0.2)
  createLight(-1, 0, 0, 0.2)
  createLight(0, 1, 0, 0.8)
  createLight(0, 0, 1, 0.6)
  createLight(0, 0, -1, 0.6)

  return scene
}

const createBox = () => {
  //Create the bounding box
  const blockGeometry = new BoxBufferGeometry()
  const blockMaterial = new MeshLambertMaterial({ color: 0x2251A9 })
  const blockElement = new Mesh(blockGeometry, blockMaterial)
  blockElement.position.set(0.5, -0.5001, 0.5)
  return blockElement
}

//This should be rewritten soon
const createGrid = () => {
  const gridSquares = 7
  //Set up the grid
  const gridGroup = new Group()
  gridGroup.userData.dontRenderGif = true

  let matrix = new Matrix4().makeRotationZ(Math.PI / 2)

  const majorGridMaterial = new MeshBasicMaterial({ color: 0x121212 })
  const minorGridMaterial = new MeshBasicMaterial({ color: 0x1c1c1c })
  const subGridMaterial = new MeshBasicMaterial({ color: 0x292929 })

  let mesh1 = new Mesh(new CylinderBufferGeometry(0.005, 0.005, gridSquares - 1), majorGridMaterial)
  let mesh2 = new Mesh(new CylinderBufferGeometry(0.003, 0.003, gridSquares - 1), minorGridMaterial)
  let mesh3 = new Mesh(new CylinderBufferGeometry(0.002, 0.002, gridSquares - 1), subGridMaterial)

  mesh1.geometry.applyMatrix4(matrix);
  mesh2.geometry.applyMatrix4(matrix);
  mesh3.geometry.applyMatrix4(matrix);

  for (let i = 0; i < gridSquares; i++) {
    let line = mesh1.clone()
    line.position.z = i - gridSquares / 2 + 1
    line.position.x = 0.5
    gridGroup.add(line);

    line = mesh1.clone()
    line.position.x = i - gridSquares / 2 + 1
    line.position.z = 0.5
    line.rotation.y = 90 * Math.PI / 180
    gridGroup.add(line);

    if (i === 0) {
      continue
    }
    for (let i2 = 1; i2 <= 4; i2++) {
      if (i2 !== 0 && i2 !== 4) {
        let line = mesh2.clone()
        line.position.z = i - gridSquares / 2 + 1 - i2 / 4
        line.position.x = 0.5
        gridGroup.add(line);

        line = mesh2.clone()
        line.position.x = i - gridSquares / 2 + 1 - i2 / 4
        line.rotation.y = 90 * Math.PI / 180;
        line.position.z = 0.5
        gridGroup.add(line);
      }

      for (let i3 = 1; i3 < 4; i3++) {
        let line = mesh3.clone()
        line.position.z = i - gridSquares / 2 + 1 - i2 / 4 - i3 / 16 + 1 / 4
        line.position.x = 0.5
        gridGroup.add(line);

        line = mesh3.clone()
        line.position.x = i - gridSquares / 2 + 1 - i2 / 4 - i3 / 16 + 1 / 4
        line.position.z = 0.5
        line.rotation.y = 90 * Math.PI / 180;
        gridGroup.add(line);
      }
    }
  }
  return {
    grid: gridGroup,
    majorGridMaterial, minorGridMaterial, subGridMaterial
  }
}