import { PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture, Quaternion } from "./three.js";
import { DinosaurDisplay, readFile } from "./displays.js";
import { OrbitControls } from './orbit_controls.js'
import { TransformControls } from './transform_controls.js'
import { ProjectTabs } from "./project_tabs.js";
import { AnimationStudio } from "./animator/animation_studio.js";
import { ModelingStudio } from "./modeling/modeling_studio.js";
import { FilesPage } from "./project/files_page.js";
import { Raytracer } from "./raytracer.js";
import { TextureStudio } from "./texture/texture_studio.js";
import { DCMModel } from "./formats/model/dcm_loader.js";
import { ProjectTabHandler } from "./project_tab_handler.js";
import { fileUploadBox } from "./util.js";

const major = 0
const minor = 4
const patch = 2

const version = `${major}.${minor}.${patch}`
document.getElementById("dumbcode-studio-version").innerText = `v${version}`

let canvasContainer = undefined //document.getElementById("display-div");
const mainArea = document.getElementById("main-area")
const display = new DinosaurDisplay()

let controls

const tabEventTypes = ['keydown']

// let material = new MeshLambertMaterial( {
//     color: 0x777777,
//     transparent: true,
//     side: DoubleSide,
//     alphaTest: 0.0001,
// } )


// let highlightMaterial = material.clone()
// highlightMaterial.emissive.setHex( 0xFF0000 )

// let selectedMaterial = material.clone()
// selectedMaterial.emissive.setHex( 0x0000FF )

const pth = new ProjectTabHandler(display)


const raytracer = new Raytracer(display, pth)

const projectTabs = new ProjectTabs()

let activeTab
let filesPage, modelingStudio, textureStudio, animationStudio

async function init() {
    //Set up the renderer
    let renderer = new WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(1, 1);

    //Set up the camera
    let camera = new PerspectiveCamera( 65, 1, 0.1, 700 )
    camera.position.set(-3.745472848477101, 2.4616311452213426, -4.53288230701089)
    camera.lookAt(0, 0, 0)

    display.setup(renderer, camera, createScene())

    //Set up the controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true
    controls.addEventListener('change', () => runFrame())

    display.createTransformControls = () => {
        let transformControls = new TransformControls(camera, renderer.domElement)
        transformControls.addEventListener('dragging-changed', e => {
            controls.enabled = !e.value;
        });
        transformControls.addEventListener('axis-changed', e => {
            let textDiv = document.getElementById("editor-mouseover")
            if(e.value === null) {
                textDiv.style.display = "block"
                raytracer.disableRaycast = false
            } else {
                textDiv.style.display = "none"
                raytracer.disableRaycast = true
            }
        })
        transformControls.space = "local"
        return transformControls
    }
}

window.onModulesFinished = async() => {
    filesPage = createFilesPage()
    animationStudio = createAnimationStudio()
    modelingStudio = createModelingStudio()
    textureStudio = createTextureStudio()

    pth.inititateTabs(filesPage, modelingStudio, textureStudio, animationStudio)

    tabEventTypes.forEach(type => document.addEventListener(type, event => activeTab.dispatchEvent( { type, event } )))

    frame()
}

export function createScene() {
    //Set up the Scene
    let scene = new Scene();
    scene.background = new Color(0x363636);

    //Set up lighting
    scene.add(new HemisphereLight());
    let dirLight = new DirectionalLight()
    dirLight.position.set(-1.25, 1.5, 1)
    dirLight.target.position.set(1, -1, -1)
    scene.add(dirLight);

    return scene
}

function frame() {
    let newTab = projectTabs.getActive(filesPage, modelingStudio, textureStudio, animationStudio)
    if(newTab !== activeTab && newTab !== undefined) {
        if(activeTab !== undefined) {
            if(activeTab.setUnactive) {
                activeTab.setUnactive()
            }
        }
        if(canvasContainer !== undefined) {
            $(display.renderer.domElement).detach()
        }
        projectTabs.tabs.forEach(t => mainArea.classList.remove("is-"+t))

        mainArea.classList.toggle("is-"+projectTabs.activeTab, true)
        activeTab = newTab

        canvasContainer = $(activeTab.domElement).find("#display-div").get(0)
        if(canvasContainer !== undefined) {
            $(display.renderer.domElement).appendTo(canvasContainer)
        }

        Array.from(document.getElementsByClassName("editor-part")).forEach(elem => {
            elem.classList.toggle("is-active", elem.getAttribute("editor-tab").split(",").includes(projectTabs.activeTab))
        })
        if(activeTab.setActive) {
            activeTab.setActive()
        }
    }
    requestAnimationFrame(frame)
    runFrame()
}

function runFrame() {
    activeTab.runFrame()
}

function renameCube(cube, newValue) {
    if(pth.model.cubeMap.has(newValue)) {
        return true
    }
    let oldValue = cube.name
    if(oldValue !== newValue) {
        cube.updateCubeName(newValue)
        pth.animationTabs.allTabs.forEach(tab => tab.handler.renameCube(oldValue, newValue))
        modelingStudio.modelerOptions.refreshOptionTexts()
    }   
    return false
}

function setCamera(camera) {
    modelingStudio.setCamera(camera)
    animationStudio.setCamera(camera)
    controls.object = camera
    display.camera = camera
}

export function updateCamera(camera, width, height) {
    if(camera.isPerspectiveCamera) {
        camera.aspect = width / height;
    }

    if(camera.isOrthographicCamera) {
        camera.left = width / -2
        camera.right = width / 2
        camera.top = height / 2
        camera.bottom = height / -2
    }
    camera.updateProjectionMatrix();
}

function createFilesPage() {
    return new FilesPage($('#files-area'), () => modelingStudio, () => textureStudio, () => animationStudio, pth)
}

function createModelingStudio() {
    return new ModelingStudio($('#modeling-area'), display, raytracer, controls, renameCube, setCamera, pth)
}

function createTextureStudio() {
    return new TextureStudio($('#texture-area'), filesPage, display, raytracer, controls, pth)
}

function createAnimationStudio() {
    return new AnimationStudio($('#animation-area') , raytracer, display, pth)
}

window.addEventListener( 'resize', () => window.studioWindowResized(), false );

window.studioWindowResized = () => {
    if(canvasContainer === undefined) {
        return
    }
    let width = canvasContainer.clientWidth
    let height = canvasContainer.clientHeight
    updateCamera(display.camera, width, height)

    display.renderer.setSize( width, height );
}

init()