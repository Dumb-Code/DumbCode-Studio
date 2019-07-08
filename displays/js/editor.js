import { Raycaster, Vector2, PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, TextureLoader, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera } from "./three.js";
import { TBLModel } from "./tbl_loader.js";
import { DinosaurDisplay } from "./displays.js";
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

let material, highlightMaterial, selectedMaterial;
let allMaterials

let maleTexture
let femaleTexture

let isMale = true

let clickY; //Used to track what part of the border has been clicked
let panelHeight

let manager

function init() {
    manager = new KeyframeManger(document.getElementById("keyframe-board"))
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
    controls.addEventListener('change', () => display.render())

    display.setup(canvasContainer, renderer, camera, createScene())
    setupDinosaur("trex")
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

async function setupDinosaur(dinosaur) {
    maleTexture = new DinosaurTexture()
    femaleTexture = new DinosaurTexture()

    await loadTextures(dinosaur)

    display.setMainModel(material, maleTexture, await getModel(dinosaur))
}

async function loadTextures(dinosaur) {
    let getTexture = location => {
        return new Promise(resolve => {
            new TextureLoader().load(location, tex => {
                tex.flipY = false
                tex.magFilter = NearestFilter;
                tex.minFilter = LinearMipMapLinearFilter;
                resolve(tex)
            })
        })
    }
    let femaleTex = getTexture(`assets/${dinosaur}/female.png`)
    let maleTex = getTexture(`assets/${dinosaur}/male.png`)
    
    let result = await Promise.all([femaleTex, maleTex])
    femaleTexture.texture = result[0]
    maleTexture.texture = result[1]
    
    material = new MeshLambertMaterial( {
        color: 0xAAAAAA,
        map: maleTexture.texture,
        transparent: true,
        side: DoubleSide,
    } )

    highlightMaterial = material.clone()
    highlightMaterial.emissive.setHex( 0xFF0000 )

    selectedMaterial = material.clone()
    selectedMaterial.emissive.setHex( 0x0000FF )

    allMaterials = [material, highlightMaterial, selectedMaterial]


    maleTexture.setup()
    femaleTexture.setup()
}

async function getModel(dinosaur) {
    let response = await fetch(`assets/${dinosaur}/model.tbl`)
    let data = await response.blob()
    return await TBLModel.loadModel(data)
}

function frame() {
    calculateIntersections()
    requestAnimationFrame(frame)
    display.display()
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

function updateSelected() {
    [...document.getElementsByClassName("editor-require-selected")].forEach(elem => {
        elem.disabled = false
        elem.classList.toggle("is-active", true)
    })

    setPosition(selected.tabulaCube.rotationPoint)
    setRotation(selected.tabulaCube.rotation)
}

function setPosition(values) {
    [...document.getElementsByClassName("input-position")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
        elem.checkValidity()
    });

    selected.tabulaCube.rotationPoint = values
    selected.parent.position.set(values[0], values[1], values[2])

}

function setRotation(values) {
    [...document.getElementsByClassName("input-rotation")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
    });

    [...document.getElementsByClassName("input-rotation-slider")].forEach(elem => {
        elem.value = ((values[elem.getAttribute("axis")] + 180) % 360) - 180
    });

    selected.tabulaCube.rotation = values
    selected.parent.rotation.set(values[0] * Math.PI / 180, values[1] * Math.PI / 180, values[2] * Math.PI / 180)
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
window.setPosition = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    let point = selected.tabulaCube.rotationPoint
    point[elem.getAttribute("axis")] = num
    setPosition(point)
}
window.setRotation = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    let angles = selected.tabulaCube.rotation
    angles[elem.getAttribute("axis")] = num
    setRotation(angles)
}
window.onAnimationFileChange = files => display.animationHandler.onAnimationFileChange(files)
window.setInertia = elem => display.animationHandler.inertia = elem.checked
window.setGrid = elem => displaygridGroup.visible = elem.checked
window.setupDinosaur = dino => setupDinosaur(dino)
window.setGender = elem => {
    isMale = elem.value == "male"
    let currentTexture = isMale ? maleTexture : femaleTexture
    allMaterials.forEach(mat => {
        mat.map = currentTexture.texture; 
        mat.needsUpdate = true 
    })
    display.checkAllCulled(currentTexture)
}

window.addValue = elem => {
    if(selected) {
        let axis = elem.getAttribute("axis")
        new ButtonSpeed().setupfor(elem, () => {
            let poss = selected.tabulaCube.rotationPoint
            poss[axis] += 0.1
            setPosition(poss)
        })
    }
}

window.subtractValue = elem => {
    if(selected) {
        let axis = elem.getAttribute("axis")
        new ButtonSpeed().setupfor(elem, () => {
            let poss = selected.tabulaCube.rotationPoint
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
       if(selected) {
            selected.material = material
       }
       selected = intersected
       selected.material = selectedMaterial
       updateSelected()
   }
}

class DinosaurTexture {
    setup() {
        let canvas = document.createElement('canvas');
        this.width = this.texture.image.width;
        this.height = this.texture.image.height;

        canvas.width = this.width
        canvas.height = this.height

        this.pixels = canvas.getContext('2d')
        this.pixels.drawImage(this.texture.image, 0, 0, this.width, this.height);
    }
}

class ButtonSpeed {

    setupfor(element, callback) {
        this.element = element;
        this.callback = callback

        this.mouseStillDown = true
        this.timeout = 500; //todo?

        this.mouseUp = e => {
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