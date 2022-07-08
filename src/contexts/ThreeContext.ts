import { useCallback } from 'react';
import { AmbientLight, BoxBufferGeometry, Camera, Clock, Color, CylinderBufferGeometry, DirectionalLight, Group, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Raycaster, REVISION, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import IndexedEventHandler from '../studio/util/WeightedEventHandler';
import { useStudio } from './StudioContext';

export type ThreeJsContext = {
  scene: Scene,
  onTopScene: Scene,
  lightGroup: Group,
  itemsGroup: Group,
  renderer: WebGLRenderer,
  controls: OrbitControls,
  raycaster: Raycaster,
  onMouseUp: IndexedEventHandler<React.MouseEvent>
  onFrameListeners: Set<(deltaTime: number) => void>,

  setSize: (width: number, height: number) => void
  getSize: () => { width: number; height: number; }

  toggleGrid: () => void
  toggleBox: () => void

  setGridColor: (majorColor: number, minorColor: number, subColor: number) => void

  getCamera: () => Camera
  setCameraType: (isPerspective: boolean) => void

  renderSingleFrame: (includeOverlay?: boolean) => void

  transformControls: TransformControls,

  box: Object3D,
  grid: Object3D,
}

export const createThreeContext = (): ThreeJsContext => {
  if (typeof window === "undefined") {
    return null as any
  }
  console.log(`Creating ThreeJs (${REVISION}) Context`)
  //Set up the renderer
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  const cameraP = new PerspectiveCamera(65, 1, 0.01, 700)
  const cameraO = new OrthographicCamera(-1, 1, -1, 1, -700, 700)

  //We need to override the zoom of the orthographic camera,
  //As we handle it in a special way for camera conversion.
  //When updating the projection matrix, we need to return 1, 
  //otherwise return the zoom
  const _updateProjectionMatrix = cameraO.updateProjectionMatrix
  cameraO.updateProjectionMatrix = () => {
    convertToOrthographic(cameraP, cameraO, controls)
    const zoom = cameraO.zoom
    cameraO.zoom = 1
    _updateProjectionMatrix.call(cameraO)
    cameraO.zoom = zoom
  }

  //Set up the camera
  let camera: Camera = cameraP
  camera.position.set(0.45, 1.5, 4.5)
  camera.lookAt(0.5, 1.5, 0.5)

  const { scene, lightGroup } = createScene()

  const { scene: onTopScene } = createScene()
  onTopScene.background = null;

  //Set up the controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.5, 0, 0.5)
  controls.screenSpacePanning = true
  controls.update()

  const raycaster = new Raycaster()

  const transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.setSize(1.25)
  transformControls.addEventListener('dragging-changed', e => {
    controls.enabled = !e.value
  })
  onTopScene.add(transformControls)

  const onMouseUp = new IndexedEventHandler<React.MouseEvent>()


  const itemsGroup = new Group()

  const { grid, majorGridMaterial, minorGridMaterial, subGridMaterial } = createGrid()
  itemsGroup.add(grid)

  const box = createBox()
  itemsGroup.add(box)

  scene.add(itemsGroup)

  let width = 100
  let height = 100

  const clock = new Clock()

  const onFrameListeners = new Set<(deltaTime: number) => void>()

  const setCameraType = (isPerspective: boolean) => {
    const currentlyIsPerspective = camera instanceof PerspectiveCamera
    if (currentlyIsPerspective !== isPerspective) {
      const otherCamera = currentlyIsPerspective ? cameraO : cameraP
      otherCamera.position.copy(camera.position)
      otherCamera.rotation.copy(camera.rotation)

      const newCamera = currentlyIsPerspective ? cameraO : convertToPerspective(cameraP, cameraO, controls)

      newCamera.zoom = 1
      newCamera.updateProjectionMatrix()

      camera = newCamera
      controls.object = newCamera
      transformControls.camera = newCamera
    }
  }

  const runFrameAndRequest = () => {
    requestAnimationFrame(runFrameAndRequest)
    onFrame()
  }

  const onFrame = () => {
    const deltaTime = clock.getDelta()
    onFrameListeners.forEach(l => l(deltaTime))

    renderSingleFrame()
  }

  const renderSingleFrame = (overlay = true) => {
    renderer.render(scene, camera)
    if (overlay) {
      renderer.clearDepth()
      renderer.render(onTopScene, camera)
    }
  }

  runFrameAndRequest()

  return {
    renderer, scene, onTopScene, controls, lightGroup, itemsGroup,
    raycaster, onMouseUp, onFrameListeners, transformControls,

    getCamera: () => camera,
    setCameraType,

    setSize: (w, h) => {
      width = w
      height = h
      renderer.setSize(width, height)

      cameraP.aspect = width / height
      cameraP.updateProjectionMatrix()

      cameraO.left = width / -2
      cameraO.right = width / 2
      cameraO.top = height / 2
      cameraO.bottom = height / -2
      cameraO.updateProjectionMatrix()
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
    },

    renderSingleFrame: (overlay) => renderSingleFrame(overlay),

    box, grid
  }
}

const createScene = () => {
  //Set up the Scene
  let scene = new Scene();
  scene.background = new Color(0x363636);

  let lightGroup = new Group()

  //Set up lighting
  lightGroup.add(new AmbientLight(0xffffff))

  let createLight = (x: number, y: number, z: number, i: number) => {
    let light = new DirectionalLight()
    light.position.set(x, y, z)
    light.intensity = i
    lightGroup.add(light)
  }

  createLight(1, 0, 0, 0.2)
  createLight(-1, 0, 0, 0.2)
  createLight(0, 1, 0, 0.8)
  createLight(0, 0, 1, 0.6)
  createLight(0, 0, -1, 0.6)

  scene.add(lightGroup)

  return { scene, lightGroup }
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

//https://github.com/mrdoob/three.js/blob/7f43f4e6ef087cec168fea25bb53591052d5ff12/examples/js/cameras/CombinedCamera.js#L61-L95
const convertToOrthographic = (cameraP: PerspectiveCamera, cameraO: OrthographicCamera, orbitControls: OrbitControls): OrthographicCamera => {
  const aspect = cameraP.aspect;

  const depth = orbitControls.target.distanceTo(orbitControls.object.position) / cameraO.zoom

  var halfHeight = Math.tan(cameraP.fov * Math.PI / 180 / 2) * depth
  var halfWidth = halfHeight * aspect;

  cameraO.left = - halfWidth;
  cameraO.right = halfWidth;
  cameraO.top = halfHeight;
  cameraO.bottom = - halfHeight;

  return cameraO
}

//https://stackoverflow.com/a/57977155
const convertToPerspective = (cameraP: PerspectiveCamera, cameraO: OrthographicCamera, orbitControls: OrbitControls): PerspectiveCamera => {
  const depth = orbitControls.target.distanceTo(orbitControls.object.position)
  // halfHeight = Math.tan(fov * Math.PI / 180 / 2) * depth
  // halfHeight / depth = Math.tan(fov * PI/180/2)
  // fov = Math.atan(halfHeight / depth) / (PI/180/2)
  const targetFov = Math.atan(cameraO.top / depth) / (Math.PI / 180 / 2)

  //Do a dolly zoom to keep the fov constant
  let init_depht_s = Math.tan(targetFov / 2.0 * Math.PI / 180.0) * 2.0;
  let current_depht_s = Math.tan(cameraP.fov / 2.0 * Math.PI / 180.0) * 2.0;

  const distance = orbitControls.target.distanceTo(orbitControls.object.position)
  const cameraMove = distance * init_depht_s / current_depht_s

  cameraP.getWorldDirection(cameraP.position).multiplyScalar(-cameraMove).add(orbitControls.target)

  return cameraP
}

export const useModelIsolationFactory = () => {
  const { scene, onTopScene, getSelectedProject, itemsGroup } = useStudio()
  const project = getSelectedProject()

  return useCallback(() => {
    itemsGroup.visible = false
    const defaultParent = project.model.modelGroup.parent!

    scene.remove(project.group)
    onTopScene.remove(project.overlayGroup)
    scene.add(project.model.modelGroup)

    project.model.traverseAll(cube => cube.updateMaterials({ selected: false, hovering: false }))
    return () => {
      scene.remove(project.model.modelGroup)
      scene.add(project.group)
      onTopScene.add(project.overlayGroup)
      defaultParent.add(project.model.modelGroup)

      project.model.traverseAll(cube => cube.updateMaterials({}))
      itemsGroup.visible = true
    }
  }, [project, itemsGroup, scene, onTopScene])
}

export const useNoBackgroundFactory = () => {
  const { scene, onTopScene } = useStudio()

  return useCallback(() => {
    const sceneBackground = scene.background
    const onTopSceneBackground = onTopScene.background
    scene.background = null
    onTopScene.background = null
    return () => {
      scene.background = sceneBackground
      onTopScene.background = onTopSceneBackground
    }
  }, [scene, onTopScene])
}