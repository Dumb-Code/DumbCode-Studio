import { PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture, EventDispatcher } from "./three.js";
import { TBLModel } from "./tbl_loader.js";
import { DinosaurDisplay, readFile } from "./displays.js";
import { OrbitControls } from './orbit_controls.js'
import { TransformControls } from './transform_controls.js'
import { HistoryList } from "./history.js";
import { ProjectTabs } from "./project_tabs.js";
import { AnimationStudio } from "./animation_studio.js";
import { ModelingStudio } from "./modeling_studio.js";
import { FilesPage } from "./files_page.js";
import { Raytracer } from "./raytracer.js";

const major = -1
const minor = -1
const patch = -1

const version = `${major}.${minor}.${patch}`
document.getElementById("dumbcode-studio-version").innerText = `v${version}`

let canvasContainer = undefined //document.getElementById("display-div");
const mainArea = document.getElementById("main-area")
const display = new DinosaurDisplay()

let controls, transformControls

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

const raytracer = new Raytracer(display, material, highlightMaterial, setAsSelected)

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

    transformControls = new TransformControls(camera, renderer.domElement)
    transformControls.addEventListener('objectChange', () => {
        let pos = raytracer.selected.parent.position
        let rot = raytracer.selected.parent.rotation

        let rotations = [rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI)
        let positions = [pos.x, pos.y, pos.z]

        setRotation(rotations, false, false)
        setPosition(positions, false, false)
        runFrame()
    } );
    transformControls.addEventListener('dragging-changed', e => {
        controls.enabled = !e.value;
    });
    transformControls.addEventListener('axis-changed', e => {
        let textDiv = document.getElementById("editor-mouseover")
        if(e.value === null) {
            textDiv.style.display = "block"
            if(raytracer.intersected && raytracer.intersected != raytracer.selected) {
                raytracer.intersected.material = material
            }
            raytracer.disableRaycast = false
        } else {
            if(raytracer.intersected && raytracer.intersected != raytracer.selected) {
                raytracer.intersected.material = highlightMaterial
            }
            textDiv.style.display = "none"
            raytracer.disableRaycast = true
        }
    })
    display.scene.add(transformControls)
    setMode("none", false)

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
            $(activeTab.domElement).detach()
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
        $(activeTab.domElement).appendTo('#main-area')

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

function setAsSelected(oldSelected, selectedElem) {
    // console.trace(selectedElem)
    let isSelected = selectedElem !== undefined;

    if(oldSelected) {
        oldSelected.children.forEach(c => c.material = material)
        if(!isSelected) {
            transformControls.detach(oldSelected);
        }
    }
    if(selectedElem) {
        selectedElem.children.forEach(c => c.material = selectedMaterial)
    }
    let visible = transformControls.visible
    setMode(visible ? transformControls.mode : "none", false);
    [...document.getElementsByClassName("editor-require-selected")].forEach(elem => {
        elem.disabled = !isSelected
        elem.classList.toggle("is-active", isSelected)
    })

    if(isSelected) {
        //Don't add history stuff, as we handle it ourselves
        setPosition(getSelectedPos(), false, false)
        setRotation(getSelectedRot(), false, false)
    } else {
        setPosition([0, 0, 0])
        setRotation([0, 0, 0])
    }

    if(activeTab === modelingStudio) {
        modelingStudio.selectedChanged()
    }
}

function renameCube(oldValue, newValue) {
    if(display.tbl.cubeMap.has(newValue) && display.tbl.cubeMap.get(newValue) !== raytracer.selected.tabulaCube) {
        return true
    }
    if(oldValue !== newValue && raytracer.selected && raytracer.selected.tabulaCube.name == oldValue) {
        let tabulaCube = raytracer.selected.tabulaCube
        tabulaCube.updateCubeName(newValue)
        animationStudio.animationHandler.renameCube(oldValue, newValue)
        modelingStudio.cubeList.elementMap.get(tabulaCube).a.innerText = newValue
    }   
    return false
}

function setPosition(values, displaysonly = false) {
    [...document.getElementsByClassName("input-position")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
        elem.checkValidity()
    });
    if(!displaysonly && raytracer.selected) {
        raytracer.selected.parent.position.set(values[0], values[1], values[2])
        
        if(activeTab === animationStudio) {
            animationStudio.positionChanged(raytracer.selected.tabulaCube, values)
        }        
        if(activeTab == modelingStudio) {
            raytracer.selected.tabulaCube.updatePosition(values)
        }
    }
}

function setRotation(values, displaysonly = false) {
    [...document.getElementsByClassName("input-rotation")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
    });

    [...document.getElementsByClassName("input-rotation-slider")].forEach(elem => {
        elem.value = ((values[elem.getAttribute("axis")] + 180) % 360) - 180
    });

    if(!displaysonly && raytracer.selected) {
        raytracer.selected.parent.rotation.set(values[0] * Math.PI / 180, values[1] * Math.PI / 180, values[2] * Math.PI / 180)

        if(activeTab === animationStudio) {
            animationStudio.rotationChanged(raytracer.selected.tabulaCube, values)
        }
        if(activeTab == modelingStudio) {
            raytracer.selected.tabulaCube.updateRotation(values)
        }
    }
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

window.toggleTranslate = () => {
    if(transformControls.visible && transformControls.mode == "translate") {
        setMode("none")
    } else {
        setMode("translate")
    }
}

window.toggleRotate = () => {
    if(transformControls.visible && transformControls.mode == "rotate") {
        setMode("none")
    } else {
        setMode("rotate")
    }
}

window.toggleGlobal = (elem, addHistory = true) => {
    let wasLocal = transformControls.space == "local"
    setGlobal(elem, wasLocal)
    if(addHistory) {
        daeHistory.addAction(() => setGlobal(elem, !wasLocal), () => setGlobal(elem, wasLocal));
    }
    
}

function setGlobal(elem, world) {
    transformControls.space = world ? "world" : "local"
    elem.classList.toggle("is-active", world)
}

function setMode(mode) {
    modeCache = mode
    if(!raytracer.selected) {
        mode = "none"
    }
    transformControls.visible = mode != "none"
    if(mode != "none") {
        let toAttach = raytracer.selected.parent
        if(mode === 'dimensions') {
            toAttach = raytracer.selected
        }
        transformControls.attach(toAttach);
        transformControls.mode = mode

        let oldelement = document.getElementById("control-rotate")
        let newelement = document.getElementById("control-translate")
        if(mode == "rotate") {
            let e = oldelement
            oldelement = newelement
            newelement = e
        }

        oldelement.classList.toggle("is-active", false)
        newelement.classList.toggle("is-active", true)
    } else {
        [...document.getElementsByClassName("transform-control-tool")].forEach(elem => elem.classList.toggle("is-active", false))
    }
}


window.setPosition = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    let point = getSelectedPos()
    point[elem.getAttribute("axis")] = num
    setPosition(point)
}

function getSelectedPos() {
    let point
    if(activeTab === animationStudio && animationStudio.manager.selectedKeyFrame) {
        point = animationStudio.manager.selectedKeyFrame.getPosition(raytracer.selected.tabulaCube.name)
    } else {
        point = raytracer.selected.parent.position.toArray()
    }
    return point
}

window.setRotation = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    let angles = getSelectedRot()
    angles[elem.getAttribute("axis")] = num
    setRotation(angles, false)
}


function getSelectedRot() {
    let angles
    if(activeTab === animationStudio && animationStudio.manager.selectedKeyFrame) {
        angles = animationStudio.manager.selectedKeyFrame.getRotation(raytracer.selected.tabulaCube.name)
    } else {
        let rawr = raytracer.selected.parent.rotation
        angles = [rawr.x, rawr.y, rawr.z].map(a => a * 180 / Math.PI)
    }
    return angles
}

window.setRotationHistory = () => {
    let rotation = getSelectedRot().splice(0)
    daeHistory.addAction(() => setRotation(rotationCache, false, false), () => setRotation(rotation, false, false))
}

window.storeRotationHistory = () => {
    rotationCache = getSelectedRot().splice(0)
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
    return new FilesPage(await loadHtml(projectTabs.files))
}

async function createModelingStudio() {
    return new ModelingStudio(await loadHtml(projectTabs.modeling), display, raytracer, transformControls, setMode, renameCube)
}

async function createAnimationStudio() {
    return new AnimationStudio(await loadHtml(projectTabs.animation) , raytracer, display, setPosition, setRotation)
}

async function initiateModel(model) {
    display.setMainModel(material, model)
    animationStudio = await createAnimationStudio()
    modelingStudio = await createModelingStudio()
    model.onCubeHierarchyChanged = () => modelingStudio.cubeHierarchyChanged()
}

window.setupTexture = async(file, nameElement) => {
    let imgtag = document.createElement("img")
    nameElement.classList.toggle("tooltip", true)
    nameElement.dataset.tooltip = file.name

    imgtag.onload = () => {

        let tex = new Texture(imgtag)

        tex.needsUpdate = true

        tex.flipY = false
        tex.magFilter = NearestFilter;
        tex.minFilter = LinearMipMapLinearFilter;


        material.map = tex
        selectedMaterial.map = tex
        highlightMaterial.map = tex

        material.needsUpdate = true
        selectedMaterial.needsUpdate = true
        highlightMaterial.needsUpdate = true
    }

    imgtag.onerror = () => {
        nameElement.dataset.tooltip = "ERROR!"
        console.error(`Unable to define image from file: ${file.name}`)
    }


    imgtag.src = await readFile(file, (reader, file) => reader.readAsDataURL(file))
}

window.setInertia = elem => display.animationHandler.inertia = elem.checked
window.setLooped = elem => display.animationHandler.looping = elem.checked
window.setGrid = elem => display.gridGroup.visible = elem.checked
window.addValue = elem => {
    if(raytracer.selected) {
        let axis = elem.getAttribute("axis")
        new ButtonSpeed().setupfor(elem, () => {
            let poss = getSelectedPos()
            poss[axis] += 0.1
            setPosition(poss)
        })
    }
}

window.subtractValue = elem => {
    if(raytracer.selected) {
        let axis = elem.getAttribute("axis")
        new ButtonSpeed().setupfor(elem, () => {
            let poss = getSelectedPos()
            poss[axis] -= 0.1
            setPosition(poss)
        })
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


export class ButtonSpeed {

    setupfor(element, callback) {
        this.element = element;
        this.callback = callback

        this.mouseStillDown = true
        this.timeout = 500; //todo?

        this.mouseUp = () => {
            this.mouseStillDown = false
            clearInterval(this.interval)
            document.removeEventListener("mouseup", this.mouseUp)
        }

        document.addEventListener("mouseup", this.mouseUp )
        this.tick()
    }

    tick() {
        if(!this.mouseStillDown) {
            return;
        }

        this.callback()

        if(this.timeout > 1) {
            this.timeout -= 75
        }
        clearInterval(this.interval)
        this.interval = setInterval(() => this.tick(), this.timeout)
    }
}

export class LinkedElement {

    constructor(elems, array = true, parseNum = true) {
        this.array = array
        this.parseNum = parseNum
        this.addElement(this.elems = elems)
        this.sliderElems = undefined
    }

    set value(value) {
        if(this.array) {
            value = [...value]
        }
        let old = this.rawValue
        this.rawValue = value
        this.visualValue = value
        this.dispatchEvent({ type: "changed", old, value })
    }
    get value() {
        return this.rawValue
    }

    set visualValue(value) {
        if(this.array) {
            this.elems.each((_i,e) => e.value = value[e.getAttribute('axis')])
            if(this.sliderElems !== undefined) {
                this.sliderElems.each((_i,e) => e.value = ((value[e.getAttribute("axis")] + 180) % 360) - 180)
            }
        } else {
            this.elems.val(value)
        }
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }

    withsliders(sliderElems) {
        this.addElement(this.sliderElems = sliderElems)
        return this
    }

    addElement(elem) {
        if(this.array) {
            elem.on('input', e => {
                let arr = this.value.splice(0)
                arr[e.target.getAttribute('axis')] = this.parseNum ? parseInt(e.target.value) : e.target.value
                this.value = arr
            })
        } else {
            elem.on('input', e => this.value = this.parseNum ? parseInt(e.target.value) : e.target.value)
        }
    }
}
Object.assign( LinkedElement.prototype, EventDispatcher.prototype );



init()
