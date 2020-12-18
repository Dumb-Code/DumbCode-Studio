import { Raycaster, Vector2, PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture } from "./three.js";
import { OrbitControls } from './orbit_controls.js'
import { DinosaurDisplay, DinosaurTexture, readFile } from "./displays.js";
import { TBLModel } from "./tbl_loader.js";
import { PlayState, ByteBuffer } from "./animations.js";

const display = new DinosaurDisplay()

const ext = "Dumb-Code/ProjectNublar"
const canvasContainer = document.querySelector(".display-div");
const animationSelectionNode = document.getElementById("animation-select-controller");

const name2Animation = new Map()

const htmlNode = document.querySelector("html")
const modalNode = document.getElementById("modal-progressbar")
const modelDataNode = document.getElementById("modal-prograssbar-data")
const tickBarNode = document.getElementById("tick-bar")

let camera, material, texture, maletex, femaletex

let female = false

let playstate = new PlayState()

function init() {
    //Set up the Scene
    let scene = new Scene();
    scene.background = new Color(0xaaaaaa);

    //Set up lighting
    scene.add(new HemisphereLight());
    let dirLight = new DirectionalLight()
    dirLight.position.set(-1.25, 1.5, 1)
    dirLight.target.position.set(1, -1, -1)
    scene.add(dirLight);

    //Set up the renderer
    let renderer = new WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

    //Set up the camera
    camera = new PerspectiveCamera( 65, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 700 )
    camera.position.set(-3.745472848477101, 2.4616311452213426, -4.53288230701089)
    camera.lookAt(0, 0, 0)

    display.setup(canvasContainer, renderer, camera, scene)

    //Set up the controls
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true
    controls.addEventListener('change', () => runFrame())

    frame()
}

async function setupInitial() {
    await setupDinosaur("tyrannosaurus")
    playAnimation("attack")
}

function frame() {
    requestAnimationFrame(frame)
    runFrame()
}

function runFrame() {
    if(display.animationHandler && !display.animationHandler.looping) {
        playstate.ticks = Math.min(playstate.ticks, display.animationHandler.totalTime)
    }

    display.display()

    if(display.animationHandler) {
        if(!display.animationHandler.looping && playstate.ticks >= display.animationHandler.totalTime) {
            togglePlaying(true)
        }
        let percValue = playstate.ticks / display.animationHandler.totalTime
        if(display.animationHandler.looping) {
            percValue %= 1
        }
        tickBarNode.value = percValue
    }
}

async function loadDinosaur(dinoName) {
    return {
        modelFolder: await request(`https://api.github.com/repos/${ext}/contents/src/main/resources/assets/projectnublar/models/entities/${dinoName}/adult`),
        maleTextureFile: await request(`https://api.github.com/repos/${ext}/contents/src/main/resources/assets/projectnublar/textures/entities/${dinoName}/male_adult.png`),
        femaleTextureFile: await request(`https://api.github.com/repos/${ext}/contents/src/main/resources/assets/projectnublar/textures/entities/${dinoName}/female_adult.png`)
    }
}

async function request(url) {
    let response = await fetch(url, {
        headers: {
            Authorization: "token 06e32c2922f7f350fb4d64bb35462754d7863e44" //Access token that does absolutly nothing
        }
    });
    let data = await response.json();
    return data;
}

window.addEventListener( 'resize', () => {
    let width = canvasContainer.clientWidth;
    let height = canvasContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    display.renderer.setSize(width, height);
}, false );

window.setupDinosaur = dino => {
    setTimeout(async() => {
        clearProgressBar()
        showProgressBar()
        let div = progressUpdate(`Loading Dinosaur ${dino}`)
        let loaded = await loadDinosaur(dino.toLowerCase())
        div.innerHTML += ` - Finished`

        let modelDownload

        let fileAnimations = []
        let folderAnimations = []

        div = progressUpdate(`Starting parsing of model folder`)
        loaded.modelFolder.forEach(element => {
            if(element.name.endsWith(".tbl")) { //Model Folder
                modelDownload = element.download_url;
            } else if(element.name.endsWith(".dca")) { //.dca file
                fileAnimations.push({ url:element.download_url, name:element.name })
            } else { //Folder animation 
                folderAnimations.push(new Promise(call => { request(element.url).then(d => call({ name:element.name, data: d }))}))
            }
        })
        div.innerHTML += ` - Finished, found ${fileAnimations.length} .dca animations, and ${folderAnimations.length} folder animations.`

        div = progressUpdate(`Started Downloading of main model`)
        let model = await TBLModel.loadModel(await fetch(modelDownload).then(f => f.blob()))
        div.innerHTML += ` - Finished`

        div = progressUpdate(`Started parsing of male texture: ${loaded.maleTextureFile.name}`)
        maletex = await loadTexture(`data:image/png;base64,${loaded.maleTextureFile.content}`)
        div.innerHTML += ` - Finished`

        maletex.flipY = false
        maletex.magFilter = NearestFilter;
        maletex.minFilter = LinearMipMapLinearFilter;
        maletex.needsUpdate = true

        div = progressUpdate(`Started parsing of female texture: ${loaded.femaleTextureFile.name}`)
        femaletex = await loadTexture(`data:image/png;base64,${loaded.femaleTextureFile.content}`)
        div.innerHTML += ` - Finished`

        femaletex.flipY = false
        femaletex.magFilter = NearestFilter;
        femaletex.minFilter = LinearMipMapLinearFilter;
        femaletex.needsUpdate = true

        let tex = female ? femaletex : maletex

        material = new MeshLambertMaterial( {
            color: 0xAAAAAA,
            transparent: true,
            side: DoubleSide,
            map: tex
        })

        texture = new DinosaurTexture()
        texture.texture = tex
        texture.setup()

        div = progressUpdate(`Started setting up main model and texture`)
        display.setMainModel(material, texture, model)
        display.animationHandler.playstate = playstate
        div.innerHTML += ` - Finished`

        while (animationSelectionNode.firstChild) {
            animationSelectionNode.removeChild(animationSelectionNode.firstChild);
        }
        name2Animation.clear()

        div = progressUpdate(`Began loading of folder animations`)

        await Promise.all(folderAnimations)
        .then(arr => { //Load animation.json and get .tbl entries from the file array
            let node
            let total = 0
            let counter = 0 
            return Promise.all(arr.map(d => {
                let meta = d.data.find(f => f.name == "animation.json")
                let animations = d.data.filter(f => f.name.endsWith(".tbl"))
                if(meta) {
                    if(node === undefined) {
                        node = progressUpdate(`Downloading animation meta data (?/?)`)
                    }
                    total++
                    return new Promise(call => 
                        fetch(meta.download_url)
                        .then(a => a.text())
                        .then(text => call({ name: d.name, animations, meta: JSON.parse(text) }))
                    )
                    .then(o => { node.innerText = `Downloading animation meta data ( ${++counter} / ${total} )`; return o })
                }
                return {name: d.name, animations}
            }))
        })
        .then(arr => { //Load the .tbl models
            let node = progressUpdate(`Parsing table models (?/?) - ?`)
            let total = 0
            let counter = 0
            return Promise.all(arr.map(d => {
                total += d.animations.length
                return new Promise(call => 
                    Promise.all(
                        d.animations.map(f => 
                            fetch(f.download_url)
                            .then(f => TBLModel.loadModel(f.arrayBuffer()))
                            .then(o => { node.innerText = `Parsing tabula models ( ${++counter} / ${total} ) - ${d.name}`; return o})
                        )
                    ).then(animations => call({ name:d.name, animations }))
                )
            }))
        })//Put the .tbl models in the name2Animation map
        .then(arr => arr.forEach(d => {
            name2Animation.set(d.name, display.animationHandler.readFromAnimationFiles(d.animations, d.meta))
            let option = document.createElement("option")
            option.innerText = d.name
            animationSelectionNode.appendChild(option)
        }))
        let fileNode = progressUpdate(`Began loading of .dca animations`)
        await Promise.all(fileAnimations)
            .then(arr => {
                if(arr.length == 0) {
                    return []
                }
                let node = progressUpdate(`Parsing .dca file (?/${arr.length}) - ?`)
                let counter = 0
                return Promise.all(arr.map(d => 
                    fetch(d.url)
                    .then(d => d.arrayBuffer())
                    .then(d => {
                        name2Animation.set(d.name, display.animationHandler.readDCAFile(new ByteBuffer(d)))
                        node.innerText = `Parsing .dca file (${++counter}/${arr.length}) - ${d.name}`
                    })
                ))
            })
        fileNode.innerText += ` - Finished`
        await folderAnimations[0].then(d => playAnimation(d.name)) //Should resolve instantly 
        div.innerHTML += ` - Finished`
        hideProgressBar()
    }, 0)
}

window.playAnimation = anim => {
    let kfs = name2Animation.get(anim)
    if(kfs !== undefined) {
        display.animationHandler.keyframes = kfs.map(k => k.cloneKeyframe())
        playstate.ticks = 0
        togglePlaying(true)
    }
}

window.toggleLoop = elem => {
    let n = !display.animationHandler.looping;
    if(!n) { //Set the looping back into the starting space
        playstate.ticks %= display.animationHandler.totalTime
    } 
    elem.classList.toggle("is-active", n)
    display.animationHandler.looping = n
}

window.togglePlaying = isCurrentlyPlaying => {
    if(isCurrentlyPlaying === undefined) {
        isCurrentlyPlaying = playstate.playing
    }
    let playing = document.getElementById("ico-when-playing")
    let paused = document.getElementById("ico-when-paused")

    if(display.animationHandler !== undefined && !display.animationHandler.looping && !isCurrentlyPlaying && playstate.ticks >= display.animationHandler.totalTime) {
        playstate.ticks = 0
    }

    if(isCurrentlyPlaying) {
        playing.style.display = "none"
        paused.style.display = "inherit"
    } else {
        playing.style.display = "inherit"
        paused.style.display = "none"
    }
    playstate.playing = !isCurrentlyPlaying
    
}

window.setTexture = value => {
    female = value
    let newTex = value ? femaletex : maletex

    material.map = newTex
    material.needsUpdate = true

    texture.texture = newTex
    texture.setup()

    display.checkAllCulled(texture)
}

window.setCurrentTicks = value => {
    playstate.ticks = display.animationHandler.totalTime * value
}

window.setSpeed = elem => {
    playstate.speed = elem.value
    elem.parentElement.setAttribute("data-tooltip", `Playback Speed: ${elem.value}`)    
}

function progressUpdate(data) {
    let div = document.createElement("div")

    div.classList.add("content")
    div.innerText = data

    modelDataNode.appendChild(div)
    return div
}

function showProgressBar() {
    htmlNode.classList.toggle("is-clipped", true)
    modalNode.classList.toggle("is-active", true)
}

function hideProgressBar() {
    htmlNode.classList.toggle("is-clipped", false)
    modalNode.classList.toggle("is-active", false)
}

function clearProgressBar() {
    while (modelDataNode.firstChild) {
        modelDataNode.removeChild(modelDataNode.firstChild);
    }
}

async function loadTexture(src) {
    return new Promise((doResolve) => {
        const image = new Image();
        image.onload = () => { doResolve(new Texture(image)) };
        image.src = src
    })
}

init()
setupInitial()