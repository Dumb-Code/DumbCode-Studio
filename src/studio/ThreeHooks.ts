import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, REVISION, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ThreeJsContext } from "../contexts/StudioContext";

export const createThreeContext: () => ThreeJsContext = () => {
  console.log(`Creating ThreeJs (${REVISION}) Context`)
  //Set up the renderer
  const renderer = new WebGLRenderer( { antialias: true, alpha: true } );
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  //Set up the camera
  const camera = new PerspectiveCamera( 65, 1, 0.1, 700 )
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

  return { renderer, camera, scene, onTopScene, controls }
}

const createScene = () => {
  //Set up the Scene
  let scene = new Scene();
  scene.background = new Color(0x363636);

  //Set up lighting
  scene.add( new AmbientLight( 0xffffff ))

  let createLight = (x:number, y:number, z:number, i:number) => {
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