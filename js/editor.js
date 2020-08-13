import { PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture } from "./three.js";
import { TBLModel } from "./tbl_loader.js";
import { DinosaurDisplay, readFile } from "./displays.js";
import { OrbitControls } from './orbit_controls.js'
import { TransformControls } from './transform_controls.js'
import { HistoryList } from "./history.js";
import { ProjectTabs } from "./project_tabs.js";
import { AnimationStudio } from "./animator/animation_studio.js";
import { ModelingStudio } from "./modeling/modeling_studio.js";
import { FilesPage } from "./files_page.js";
import { Raytracer } from "./raytracer.js";

const major = 0
const minor = 1
const patch = 1

const version = `${major}.${minor}.${patch}`
document.getElementById("dumbcode-studio-version").innerText = `v${version}`

let canvasContainer = undefined //document.getElementById("display-div");
const mainArea = document.getElementById("main-area")
const display = new DinosaurDisplay()

let controls

let material = new MeshLambertMaterial( {
    color: 0x777777,
    transparent: true,
    side: DoubleSide,
} )


let highlightMaterial = material.clone()
highlightMaterial.emissive.setHex( 0xFF0000 )

let selectedMaterial = material.clone()
selectedMaterial.emissive.setHex( 0x0000FF )

let mainModel
let modeCache, rotationCache

const raytracer = new Raytracer(display, material, highlightMaterial, selectedMaterial)

const projectTabs = new ProjectTabs()

let activeTab
let filesPage, modelingStudio, animationStudio

window.daeHistory = new HistoryList()

window.studioEscapeCallback = () => {}

document.onkeydown = e => {
    if(e.keyCode === 27) { //escape
        window.studioEscapeCallback()
    }

    if(e.ctrlKey && e.keyCode === 90) { //z
        if(e.shiftKey) {
            daeHistory.redo()
        } else {
            daeHistory.undo()
        }
    }

    if(e.ctrlKey && e.keyCode === 89) { //y
        daeHistory.redo()
    }
}

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
    filesPage = await createFilesPage()
    frame()
}

function createScene() {
    //Set up the Scene
    let scene = new Scene();
    scene.background = new Color(0xaaaaaa);

    //Set up lighting
    scene.add(new HemisphereLight());
    let dirLight = new DirectionalLight()
    dirLight.position.set(-1.25, 1.5, 1)
    dirLight.target.position.set(1, -1, -1)
    scene.add(dirLight);

    return scene
}

function frame() {
    let newTab = projectTabs.getActive(filesPage, modelingStudio, animationStudio)
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
        activeTab.setActive()
    }
    requestAnimationFrame(frame)
    runFrame()
}

function runFrame() {
    activeTab.runFrame()
}

function renameCube(oldValue, newValue) {
    let selected = raytracer.selectedSet.size === 1 ? raytracer.firstSelected() : null
    if(selected !== null && display.tbl.cubeMap.has(newValue) && display.tbl.cubeMap.get(newValue) !== selected.tabulaCube) {
        return true
    }
    if(oldValue !== newValue && selected !== null && selected.tabulaCube.name == oldValue) {
        let tabulaCube = selected.tabulaCube
        tabulaCube.updateCubeName(newValue)
        animationStudio.animationTabHandler.allTabs.forEach(tab => tab.handler.renameCube(oldValue, newValue))
        modelingStudio.cubeList.elementMap.get(tabulaCube).a.innerText = newValue
    }   
    return false
}

function setTexture(tex) {
    material.map = tex
    selectedMaterial.map = tex
    highlightMaterial.map = tex

    material.needsUpdate = true
    selectedMaterial.needsUpdate = true
    highlightMaterial.needsUpdate = true
}

function updateCamera(camera, width, height) {
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

window.changeCamera = elem => {
    if(canvasContainer === undefined) {
        return
    }
    let cam
    switch(elem.value) {
        case "perspective":
            cam = new PerspectiveCamera( 65, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 700 )
            break;
        case "orthographic":
            cam = new OrthographicCamera(canvasContainer.clientWidth / -2, canvasContainer.clientWidth / 2, canvasContainer.clientHeight / 2, canvasContainer.clientHeight / -2, 0.1, 700)
            cam.zoom = 100
            cam.updateProjectionMatrix()
            break
    }
    cam.position.set(-3.745472848477101, 0.9616311452213426, -4.53288230701089)
    cam.lookAt(0, 0, 0)

    controls.object = cam
    display.camera = cam

}

window.createNewModel = () => {
    initiateModel(new TBLModel())
}

window.setupMainModel = async(file, nameElement) => {
    nameElement.classList.toggle("tooltip", true)

    nameElement.dataset.tooltip = file.name

    try {
        initiateModel(await TBLModel.loadModel(readFile(file)))
    } catch(err) {
        nameElement.dataset.tooltip = "ERROR!"
        console.error(`Error from file ${file.name}: ${err.message}`)
    }

}

async function createFilesPage() {
    return new FilesPage($('#files-area'), () => modelingStudio, () => animationStudio)
}

async function createModelingStudio() {
    return new ModelingStudio($('#modeling-area'), display, raytracer, controls, renameCube, setTexture)
}

async function createAnimationStudio() {
    return new AnimationStudio($('#animation-area') , raytracer, display)
}

async function initiateModel(model) {
    display.setMainModel(material, model)
    animationStudio = await createAnimationStudio()
    modelingStudio = await createModelingStudio()
    let old = model.onCubeHierarchyChanged
    model.onCubeHierarchyChanged = () => {
        modelingStudio.cubeHierarchyChanged()
        old()
    }
}

window.addEventListener( 'resize', e => window.studioWindowResized(), false );

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
