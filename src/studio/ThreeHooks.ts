import { scryptSync } from "crypto";
import { AmbientLight, BoxBufferGeometry, Color, CylinderBufferGeometry, DirectionalLight, Group, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, REVISION, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ThreeJsContext } from "../contexts/StudioContext";

export const createThreeContext: () => ThreeJsContext = () => {
  console.log(`Creating ThreeJs (${REVISION}) Context`)
  //Set up the renderer
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  //Set up the camera
  const camera = new PerspectiveCamera(65, 1, 0.1, 700)
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

  const grid = createGrid()
  scene.add(grid)

  const box = createBox()
  scene.add(box)

  let width = 100
  let height = 100

  const onFrame = () => {
    requestAnimationFrame(onFrame)

    renderer.render(scene, camera)

    renderer.clearDepth()
    renderer.render(onTopScene, camera)
  }

  onFrame()

  return {
    renderer, camera, scene, onTopScene, controls,

    setSize: (w, h) => {
      width = w
      height = h
      renderer.setSize(width, height)
    },

    getSize: () => {
      return { width, height }
    },

    toggleBox: () => box.visible = !box.visible,
    toggleGrid: () => grid.visible = !grid.visible

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
  let mesh1 = new Mesh(new CylinderBufferGeometry(0.005, 0.005, gridSquares - 1), new MeshBasicMaterial({ color: 0x121212 }))
  let mesh2 = new Mesh(new CylinderBufferGeometry(0.003, 0.003, gridSquares - 1), new MeshBasicMaterial({ color: 0x1c1c1c }))
  let mesh3 = new Mesh(new CylinderBufferGeometry(0.002, 0.002, gridSquares - 1), new MeshBasicMaterial({ color: 0x292929 }))

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
  return gridGroup
}