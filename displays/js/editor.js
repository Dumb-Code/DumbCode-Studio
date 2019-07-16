import { Raycaster, Vector2, PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, TextureLoader, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture } from "./three.js";
import { TBLModel } from "./tbl_loader.js";
import { DinosaurDisplay, DinosaurTexture, readFile } from "./displays.js";
import { OrbitControls } from './orbit_controls.js'
import { KeyframeManger } from './keyframe_manager.js'

const container = document.getElementById("editor-container")
const panel = document.getElementById("editor");
const canvasContainer = document.getElementById("display-div");
const display = new DinosaurDisplay()

let controls
let selected
let intersected

let mouse = new Vector2(-5, -5);
let mouseClickDown = new Vector2(-5, -5)
let rawMouse = new Vector2();
let mouseDown = false

let material = new MeshLambertMaterial( {
    color: 0xAAAAAA,
    transparent: true,
    side: DoubleSide,
} )

let highlightMaterial = material.clone()
highlightMaterial.emissive.setHex( 0xFF0000 )

let selectedMaterial = material.clone()
selectedMaterial.emissive.setHex( 0x0000FF )

let mainModel

let texture = new DinosaurTexture()

let clickY; //Used to track what part of the border has been clicked
let panelHeight

let manager = new KeyframeManger(document.getElementById("keyframe-board"), this)

let escapeCallback = () => {}


document.onkeydown = e => {
    if(e.key === "Escape") {
        escapeCallback()
    }
}

container.addEventListener("mousedown", () => escapeCallback = () => {
    if(manager.selectedKeyFrame) {
        manager.selectedKeyFrame.selectChange(false)
    }
    manager.selectedKeyFrame = undefined
})
canvasContainer.addEventListener("mousedown", () => escapeCallback = () => setAsSelected(undefined))

function init() {
    manager.display = display;
    //Set up the renderer
    let renderer = new WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

    //Set up the camera
    let camera = new PerspectiveCamera( 65, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 700 )
    camera.position.set(-3.745472848477101, 0.9616311452213426, -4.53288230701089)
    camera.lookAt(0, 0, 0)

    //Set up the controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true
    controls.addEventListener('change', () => display.render())

    display.setup(canvasContainer, renderer, camera, createScene())
    setHeights(320)
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
    calculateIntersections()
    requestAnimationFrame(frame)
    if(display.animationHandler) {
        manager.ensureFramePosition()
    }
    
    display.display(() => manager.setupSelectedPose())
    
    if(selected) {
        let pos = selected.parent.position
        let rot = selected.parent.rotation
        setPosition([pos.x, pos.y, pos.z], {displaysonly: true})
        setRotation([rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI), {displaysonly: true})
    }
}

function calculateIntersections() {
    let textDiv = document.getElementById("editor-mouseover")

    if(intersected) {
        let style = textDiv.style
        let divRect = textDiv.getBoundingClientRect()
        style.left = rawMouse.x - divRect.width/2 + "px"
        style.top = rawMouse.y - 35 + "px"
    }

    let raycaster = new Raycaster()
    raycaster.setFromCamera(mouse, display.camera);

    if(display.tbl) {
        let intersects = raycaster.intersectObjects(display.tbl.modelCache.children , true);
        if(!mouseDown && !document.getElementById("modal-settings").classList.contains("is-active")) {
            if(intersects.length > 0) {
                if(intersected != intersects[0].object) {
                    if(intersected && intersected != selected) {
                        intersected.material = material
                    }
        
                    intersected = intersects[0].object
                    textDiv.innerHTML = intersected.tabulaCube.name
                    
                    if(intersected != selected) {
                        intersected.material = highlightMaterial
                    } 
                } 
                textDiv.style.display = "block"
            } else {
                if(intersected && intersected != selected) {
                    intersected.material = material
                    intersected = null
                }
                textDiv.style.display = "none"
            }
        }
    }
}

function resize(e) {
    let range = window.innerHeight + canvasContainer.offsetTop
    let height = range - (e.y) + clickY


    let panelHeight = Math.min(Math.max(height, 100), 500)
    setHeights(panelHeight)
}

function setHeights(height) {
    panelHeight = height
    panel.style.height = panelHeight + "px";
    canvasContainer.style.height = (window.innerHeight - panelHeight) + "px"
    onWindowResize()
}

function setAsSelected(selectedElem) {
    if(selected) {
        selected.material = material
    }
    let isSelected = selectedElem !== undefined;
    selected = selectedElem;
    [...document.getElementsByClassName("editor-require-selected")].forEach(elem => {
        elem.disabled = !isSelected
        elem.classList.toggle("is-active", isSelected)
    })

    if(isSelected) {
        setPosition(getSelectedPos())
        setRotation(getSelectedRot())
    } else {
        setPosition([0, 0, 0])
        setRotation([0, 0, 0])
    }
}

function setPosition(values, options) {
    [...document.getElementsByClassName("input-position")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
        elem.checkValidity()
    });

    if((!options || !options.displaysonly) && selected) {
        selected.parent.position.set(values[0], values[1], values[2])
        
        if(manager.selectedKeyFrame) {
            manager.selectedKeyFrame.rotationPointMap.set(selected.tabulaCube.name, values)
            display.animationHandler.keyframesDirty()
        }
    }
}

function setRotation(values, options) {
    [...document.getElementsByClassName("input-rotation")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
    });

    [...document.getElementsByClassName("input-rotation-slider")].forEach(elem => {
        elem.value = ((values[elem.getAttribute("axis")] + 180) % 360) - 180
    });

    if((!options || !options.displaysonly) && selected) {
        selected.parent.rotation.set(values[0] * Math.PI / 180, values[1] * Math.PI / 180, values[2] * Math.PI / 180)

        if(manager.selectedKeyFrame) {
            manager.selectedKeyFrame.rotationMap.set(selected.tabulaCube.name, values)
            display.animationHandler.keyframesDirty()
        }
    }
}

export async function createGif(fps, progressCallback = undefined) {
    return new Promise((resolve, reject) => {
        if(!display.animationHandler.currentIncrement) {
            reject("No Animation Playing")
            return
        }
    
        let width = window.innerWidth
        let height = window.innerHeight
    
        let gif = new GIF({
            workers: 2,
            quality: 10,
            width: width,
            height: height,
            workerScript: "./js/gif.worker.js",
            transparent: 0x000000
        });
    
        let dummyRenderer = new WebGLRenderer({
            alpha:true
        });
    
        dummyRenderer.setClearColor(0x000000, 0);
        dummyRenderer.setSize( width, height );
    
        let dummyScene = createScene()
        dummyScene.background = null
        dummyScene.add(display.tbl.modelCache)
    

        let dummyCamera = display.camera.clone()
        updateCamera(dummyCamera, width, height)

        display.animationHandler.reset()
        
        let started = false
        let delay = 1 / fps
    
        setTimeout(() => {
            while(true) {
                if(display.animationHandler.poseIndex == 1) {
                    started = true
                }
                if(display.animationHandler.poseIndex == 0 && started) {
                    break
                }
                display.animationHandler.animate(delay)
        
                dummyRenderer.render( dummyScene, dummyCamera )
                gif.addFrame(dummyRenderer.domElement, {copy: true, delay: delay * 1000})
            }

            display.scene.add(display.tbl.modelCache)
            
            gif.on("finished", resolve);
            if(progressCallback) {
                gif.on("progress", progressCallback)
            }
            gif.render();
        }, 0)

    })
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

window.downloadDCA = () => {
    if(display.animationHandler) {
        let buffer = new ByteBuffer()

        buffer.writeNumber(0) //version
        buffer.writeNumber(display.animationHandler.sortedTimes.length)

        display.animationHandler.sortedTimes.forEach(kf => {
            buffer.writeNumber(kf.startTime)
            buffer.writeNumber(kf.duration)

            buffer.writeNumber(kf.rotationMap.size)
            kf.rotationMap.forEach((entry, cubename) => {
                buffer.writeString(cubename)
                buffer.writeNumber(entry[0])
                buffer.writeNumber(entry[1])
                buffer.writeNumber(entry[2])
            })

            buffer.writeNumber(kf.rotationPointMap.size)
            kf.rotationPointMap.forEach((entry, cubename) => {
                buffer.writeString(cubename)
                buffer.writeNumber(entry[0])
                buffer.writeNumber(entry[1])
                buffer.writeNumber(entry[2])
            })
        })


        let blob = new Blob([buffer.buffer]);
        let url = window.URL.createObjectURL(blob);

        let a = document.createElement("a");
        a.href = url;
        a.download = mainModel.name + ".dca";
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

window.setupAnimation = async(file, nameElement) => {
    nameElement.classList.toggle("tooltip", true)
    nameElement.dataset.tooltip = file.name

    let buffer = new ByteBuffer(await readFile(file, (reader, file) => reader.readAsArrayBuffer(file)))
    
    buffer.readNumber() //Version. Currently ignored
    
    let length = buffer.readNumber()

    let keyframes = []

    for(let i = 0; i < length; i++) {
        let kf = display.animationHandler.createKeyframe()

        kf.startTime = buffer.readNumber()
        kf.duration  = buffer.readNumber()

        let rotSize = buffer.readNumber()
        for(let r = 0; r < rotSize; r++) {
            kf.rotationMap.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
        }

        let posSize = buffer.readNumber()
        for(let p = 0; p < posSize; p++) {
            kf.rotationPointMap.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
        }

        keyframes.push(kf)
    }
    display.animationHandler.keyframes = keyframes
    display.animationHandler.keyframesDirty()
    
    //todo: remove all previous elements
    manager.reframeKeyframes()
}

window.downloadGif = async(elem) => {
    elem.classList.toggle("is-loading", true)
    elem.parentNode.classList.toggle("tooltip", true)

    elem.parentNode.dataset.tooltip = "Recording..."
    
    let fps = [...document.getElementsByClassName('fps-radio')].find(elem => elem.checked).getAttribute('fps');
    let blob = await createGif(fps, p => {
        elem.parentNode.dataset.tooltip = Math.round(p * 100) + "%"
    })

    if(blob) {
        let url = URL.createObjectURL(blob)
        let a = document.createElement("a");
        a.href = url;
        a.download = "dinosaur.gif" //todo: name from model?
        a.click() 
    }

    elem.parentNode.classList.toggle("tooltip", false)
    elem.classList.toggle('is-loading', false)    
}

window.setSpeed = valueIn => {
    let value = Math.round(Math.pow(2, valueIn) * 100) / 100
    document.getElementById("playback-speed").innerHTML = value
    manager.playstate.speed = value
}

window.resetKeyFrames = () => {
    manager.playstate.ticks = 0
    display.animationHandler.tbl.resetAnimations()
}

window.deleteKeyframe = () => {
    if(manager.selectedKeyFrame) {
        let index = display.animationHandler.keyframes.indexOf(manager.selectedKeyFrame)
        if(index > 0) {
            display.animationHandler.keyframes.splice(index, 1)
            manager.entryBoard.removeChild(manager.selectedKeyFrame.element)
            display.animationHandler.keyframesDirty()
            
            manager.selectedKeyFrame = undefined
            manager.reframeKeyframes()
        }
    }
}

window.addKeyframe = () => {
    if(display.animationHandler) {

        if(manager.selectedKeyFrame) {
            manager.selectedKeyFrame.selectChange(false)
        }

        let kf = display.animationHandler.createKeyframe()

        kf.duration = 5
        kf.startTime = manager.playstate.ticks

        display.animationHandler.keyframes.push(kf)
        display.animationHandler.keyframesDirty()

        manager.reframeKeyframes()

        kf.selectChange(true)
        manager.selectedKeyFrame = kf

    }
}

window.setStartTime = value => {
    if(manager.selectedKeyFrame) {
        manager.selectedKeyFrame.startTime = value
        display.animationHandler.keyframesDirty()
        manager.updateKeyFrame(manager.selectedKeyFrame)
    }
}

window.setDuration = value => {
    if(manager.selectedKeyFrame) {
        let diff = value - manager.selectedKeyFrame.duration
        manager.selectedKeyFrame.duration = value
        manager.selectedKeyFrame.startTime -= diff
        display.animationHandler.keyframesDirty()
        manager.updateKeyFrame(manager.selectedKeyFrame)
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
    if(manager.selectedKeyFrame) {
        point = manager.selectedKeyFrame.getPosition(selected.tabulaCube.name)
    } else {
        point = selected.parent.position.toArray()
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
    setRotation(angles)
}
function getSelectedRot() {
    let angles
    if(manager.selectedKeyFrame) {
        angles = manager.selectedKeyFrame.getRotation(selected.tabulaCube.name)
    } else {
        let rawr = selected.parent.rotation
        angles = [rawr.x, rawr.y, rawr.z].map(a => a * 180 / Math.PI)
    }
    return angles
}
window.setupMainModel = async(file, nameElement) => {
    mainModel = {name: file.name}
    nameElement.classList.toggle("tooltip", true)

    nameElement.dataset.tooltip = file.name

    try {
        mainModel.model = await TBLModel.loadModel(readFile(file))
    } catch(err) {
        nameElement.dataset.tooltip = "ERROR!"
        console.error(`Error from file ${file.name}: ${err.message}`)
    }

    if(texture.texture) {
        display.setMainModel(material, texture, mainModel.model)
        display.animationHandler.playstate = manager.playstate
    }
}
window.setupTexture = async(file, nameElement) => {
    let imgtag = document.createElement("img")
    nameElement.classList.toggle("tooltip", true)
    nameElement.dataset.tooltip = file.name

    imgtag.onload = () => {

        texture = new DinosaurTexture()
        let tex = new Texture(imgtag)

        tex.needsUpdate = true

        tex.flipY = false
        tex.magFilter = NearestFilter;
        tex.minFilter = LinearMipMapLinearFilter;

        material.map = tex
        selectedMaterial.map = tex
        highlightMaterial.map = tex

        texture.texture = tex

        texture.setup()

        if(mainModel) {
            display.setMainModel(material, texture, mainModel.model)
            display.animationHandler.playstate = manager.playstate
        }
    }

    imgtag.onerror = () => {
        nameElement.dataset.tooltip = "ERROR!"
        console.error(`Unable to define image from file: ${file.name}`)
    }


    imgtag.src = await readFile(file, (reader, file) => reader.readAsDataURL(file))
}
window.onAnimationFileChange = async(files) => {
    await display.animationHandler.onAnimationFileChange(files)
    //todo: remove all previous elements
    manager.reframeKeyframes()
}
window.setInertia = elem => display.animationHandler.inertia = elem.checked
window.setGrid = elem => display.gridGroup.visible = elem.checked
window.addValue = elem => {
    if(selected) {
        let axis = elem.getAttribute("axis")
        new ButtonSpeed().setupfor(elem, () => {
            let poss = getSelectedPos()
            poss[axis] += 0.1
            setPosition(poss)
        })
    }
}

window.subtractValue = elem => {
    if(selected) {
        let axis = elem.getAttribute("axis")
        new ButtonSpeed().setupfor(elem, () => {
            let poss = getSelectedPos()
            poss[axis] -= 0.1
            setPosition(poss)
        })
    }
}

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'resize', () => setHeights(panelHeight), false );
document.addEventListener( 'mousemove', onMouseMove, false );

document.addEventListener( 'mousedown', onMouseDown, false );
document.addEventListener( 'mouseup', onMouseUp, false );

container.addEventListener("mousedown", e => {
    if (e.offsetY < 0) {
        clickY = 15 + e.offsetY
        document.addEventListener("mousemove", resize, false);
        document.body.className = "disable-select"
    }
}, false);

document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", resize, false)
    document.body.className = undefined
}, false);

document.addEventListener('DOMContentLoaded', init, false);

function onWindowResize() {
    let width = canvasContainer.clientWidth;
    let height = canvasContainer.clientHeight;
    updateCamera(display.camera, width, height)
    display.renderer.setSize( width, height );
}

function onMouseMove( event ) {
    rawMouse.x = event.clientX
    rawMouse.y = event.clientY

    let rect = canvasContainer.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

}

function onMouseDown( event ) {
   mouseDown = true
   mouseClickDown.x = event.clientX
   mouseClickDown.y = event.clientY
}

function onMouseUp( event ) {
   mouseDown = false
   let xMove = Math.abs(mouseClickDown.x - event.clientX)
   let yMove = Math.abs(mouseClickDown.y - event.clientY)

   if(intersected && (xMove < 5 || yMove < 5)) {
       setAsSelected(intersected)
   }
}

class ButtonSpeed {

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

class ByteBuffer {
    constructor(buffer = new ArrayBuffer(0)) {
        this.offset = 0
        this.buffer = buffer
    }

    _addBuffer(buffer) {
        let tmp = new Uint8Array(this.buffer.byteLength + buffer.byteLength)
        tmp.set(new Uint8Array(this.buffer), 0)
        tmp.set(new Uint8Array(buffer), this.buffer.byteLength)
        this.buffer = tmp.buffer
    }

    writeNumber(num) {
        let buffer = new ArrayBuffer(4)
        let veiw = new DataView(buffer)
        veiw.setFloat32(0, num)
        this._addBuffer(buffer)
    }

    writeString(str) {
        let arr = new TextEncoder().encode(str).buffer
        this.writeNumber(arr.byteLength)
        this._addBuffer(arr)
    }

    readNumber() {
        let veiw = new DataView(this.buffer)
        let num = veiw.getFloat32(this.offset)
        this.offset += 4
        return num
    }

    readString() {
        let length = this.readNumber()
        let result = new TextDecoder().decode(this.buffer.slice(this.offset, this.offset + length))
        this.offset += length
        return result
    }
}