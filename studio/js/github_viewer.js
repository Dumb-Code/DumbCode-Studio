import { Raycaster, Vector2, PerspectiveCamera, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide, OrthographicCamera, Texture } from "./three.js";
import { OrbitControls } from './orbit_controls.js'
import { DinosaurDisplay, DinosaurTexture, readFile } from "./displays.js";
import { TBLModel } from "./tbl_loader.js";

const display = new DinosaurDisplay()

const ext = "Dumb-Code/ProjectNublar"
const canvasContainer = document.getElementById("display-div");
const animationSelectionNode = document.getElementById("animation-select-controller");

const name2Animation = new Map()

let camera

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

function frame() {
    requestAnimationFrame(frame)
    runFrame()
}

function runFrame() {
    display.display()
}

async function loadDinosaur(dinoName) {
    return {
        modelFolder: await request(`https://api.github.com/repos/${ext}/contents/src/main/resources/assets/projectnublar/models/entities/${dinoName}/adult`),
        textureFile: await request(`https://api.github.com/repos/${ext}/contents/src/main/resources/assets/projectnublar/textures/entities/${dinoName}/male_adult.png`)
    }
}

async function request(url) {
    let response = await fetch(url);
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

init()
window.setupDinosaur = async dino => {
    let loaded = await loadDinosaur(dino.toLowerCase())

    let modelDownloadFolder

    let fileAnimations = []
    let folderAnimations = []

    loaded.modelFolder.forEach(element => {
        if(element.name.endsWith(".tbl")) { //Model Folder
            modelDownloadFolder = element.download_url;
        } else if(element.name.endsWith(".dca")) { //.dca file
            fileAnimations.push(element.download_url)
        } else { //Folder animation 
            folderAnimations.push({ name:element.name, data: request(element.url) })
        }
    })


    // let fetchedModelResponse = 
    let model = await TBLModel.loadModel(await fetch(modelDownloadFolder).then(f => f.blob()))

    let tex = await loadTexture(`data:image/png;base64,${loaded.textureFile.content}`)

    tex.flipY = false
    tex.magFilter = NearestFilter;
    tex.minFilter = LinearMipMapLinearFilter;
    tex.needsUpdate = true

    let material = new MeshLambertMaterial( {
        color: 0xAAAAAA,
        transparent: true,
        side: DoubleSide,
        map: tex
    })

    let texture = new DinosaurTexture()
    texture.texture = tex
    texture.setup()

    display.setMainModel(material, texture, model)

    while (animationSelectionNode.firstChild) {
        animationSelectionNode.removeChild(animationSelectionNode.firstChild);
    }
    name2Animation.clear()

    folderAnimations.forEach(folder => {
        let option = document.createElement("option")
        name2Animation.set(folder.name, async() => {
            let files = await folder.data
            let meta = files.find(d => d.name == "animation.json")
            if(meta !== undefined) {
                meta = JSON.parse(await fetch(meta.download_url).then(a => a.text()))
            }
            
            let models = await Promise.all(
                files.filter(d => d.name.endsWith(".tbl"))
                .map(d => fetch(d.download_url))
            ).then(arr => 
                Promise.all(
                    arr.map(d => TBLModel.loadModel(d.blob()))
                )
            )

            display.animationHandler.loadFromAnimationFiles(models, meta)
            
            let play = display.animationHandler.playstate
            play.ticks = 0
            play.playing = true
        })
        option.innerHTML = folder.name
        animationSelectionNode.appendChild(option)
    })
}

window.playAnimation = async anim => {
    let animation = name2Animation.get(anim)
    if(animation !== undefined) {
        animation()
    }
}

async function loadTexture(src) {
    return new Promise((doResolve) => {
        const image = new Image();
        image.onload = () => { doResolve(new Texture(image)) };
        image.src = src
    })
}