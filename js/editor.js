import { PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture, Quaternion, Group } from "./three.js";
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
import { DirectionalIndecators } from "./directional_indicators.js";

const major = 0
const minor = 7
const patch = 3

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

let directionalIndecators

let activeTab
let filesPage, modelingStudio, textureStudio, animationStudio

let allTransformControls = []

async function init() {
    //Set up the renderer
    var renderer = new WebGLRenderer( { alpha: true } );
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);


    //Set up the camera
    let camera = new PerspectiveCamera( 65, 1, 0.1, 700 )
    camera.position.set(0.45, 1.5, 4.5)
    camera.lookAt(0.5, 1.5, 0.5)

    let onTop = new Scene()
    onTop.background = null;

    //Set up the controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.5, 0, 0.5)
    controls.screenSpacePanning = true
    display.dontReRender = true
    controls.addEventListener('change', () => display.dontReRender ? 0 : runFrame())
    controls.update()
    display.false = true

    //When an input is focused on don't allow for keyboard controls.
    $(document)
    .click(e => {
        if(e.target !== document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur()
        }
    })
    .focusin(e => e.target.nodeName == "INPUT" ? controls.enableKeys = false : 0)
    .focusout(e => e.target.nodeName == "INPUT" ? controls.enableKeys = true : 0)
    .keydown(e => {
        if(document.activeElement.nodeName == "INPUT") {
            return
        }
        if(e.ctrlKey) {
            const angle = 0.0872665 //5 degrees
            switch (e.keyCode) {
                case 98: //num2
                    controls.rotateUp(-angle)
                    break;
                case 100: //num4
                    controls.rotateLeft(angle)
                    break;
                case 102: //num6
                    controls.rotateLeft(-angle)
                    break;
                case 104: //num8
                    controls.rotateUp(angle)
                    break;
                default:
                    return
            }
            controls.update()
            e.stopPropagation()
        }
    })
    
    directionalIndecators = new DirectionalIndecators(display, controls)

    display.setup(renderer, camera, createScene(), onTop, directionalIndecators)

    display.createTransformControls = () => {
        let transformControls = new TransformControls(camera, renderer.domElement)
        allTransformControls.push(transformControls)
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

    display.renderTopGroup = new Group()
    display.onTopScene.add(display.renderTopGroup)
}

window.onModulesFinished = async() => {
    filesPage = createFilesPage()
    animationStudio = createAnimationStudio()
    modelingStudio = createModelingStudio()
    textureStudio = createTextureStudio()

    pth.inititateTabs(filesPage, modelingStudio, textureStudio, animationStudio)

    tabEventTypes.forEach(type => document.addEventListener(type, event => activeTab.dispatchEvent( { type, event } )))

    directionalIndecators.domFinished()
    $('.display-div').mousedown(e => display.mousedown.fireEvent(e))

    //Fix bulma dropdown boxes
    $('.dropdown:not(.is-hoverable) .dropdown-menu').get().forEach(t => $(t).click(e => {
        if(t.parentNode.classList.contains('is-active')) {
            e.stopPropagation()
        }
    }))
    

    frame()
}

window.onbeforeunload = function() { 
    return "Some changes may be unsaved, would you like to leave the page?";
}; 

export function createScene() {
    //Set up the Scene
    let scene = new Scene();
    scene.background = new Color(0x363636);

    //Set up lighting
    scene.add(new HemisphereLight());

    let dirLight = new DirectionalLight()
    dirLight.position.set(-1.25, 1.5, 0)
    dirLight.target.position.set(0, 0, 0)
    scene.add(dirLight);

    dirLight = new DirectionalLight()
    dirLight.intensity = 0.75;
    dirLight.position.set(1.25, -1.5, 0)
    dirLight.target.position.set(0, 0, 0)
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

        canvasContainer = $(activeTab.domElement).find(".display-div").get(0)
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
    controls.object = camera
    display.camera = camera
    allTransformControls.forEach(tc => tc.camera = camera)
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

    display.setSize(width, height)
}

init()
