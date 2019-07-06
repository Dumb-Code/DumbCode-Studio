import { Raycaster, Vector2, PerspectiveCamera, Clock, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, Geometry, Vector3, LineBasicMaterial, Group, Line, TextureLoader, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide } from "./three.js";
import { OrbitControls } from './orbit_controls.js'
import { AnimationHandler } from './animations.js'
import { TBLModel } from './tbl_loader.js'

//BIG OLD TODO:
// - Abstract this so everything isn't static, and have everything controled outwards. 
//   This is to allow for the `editor.js` to just import this and change all the models and texture stuff
//   This is eventually to allow for easy model veiwing that isn't animation editor.

export let camera
let scene, renderer, controls, clock;

let container
let mouseDown = false

let gridGroup, textDiv;
let allCubes = []
let animationMap = new Map()

let tabulaModel

let material, highlightMaterial, selectedMaterial;
let allMaterials

let raycaster = new Raycaster();
let mouse = new Vector2(-5, -5);
let mouseClickDown = new Vector2(-5, -5)
let rawMouse = new Vector2();

let intersected
let selected

let animationHandler = new AnimationHandler(animationMap)

let maleTexture
let femaleTexture
let currentTexture
let isMale = true

//Export things 
window.onAnimationFileChange = files => animationHandler.onAnimationFileChange(files)
window.setInertia = elem => animationHandler.inertia = elem.checked
window.setGrid = elem => gridGroup.visible = elem.checked
window.setupEverythingDinosaur = dino => setupEverythingDinosaur(dino)
window.setGender = elem => {
    isMale = elem.value == "male"
    console.log(isMale)
    currentTexture = isMale ? maleTexture : femaleTexture
    allMaterials.forEach(mat => {
        mat.map = currentTexture.texture; 
        mat.needsUpdate = true 
    })
    checkAllCulled()
}

function init() {

    container = document.getElementById( 'display-div' );
    
	setupRenderer()

	if ( ! renderer.extensions.get( 'WEBGL_depth_texture' ) ) {
		document.querySelector( '#error' ).style.display = 'block';
		return;
    }
    
    clock = new Clock()

    setupCamera()

    setupControls()

    scene = setupScene()

    setupGrid()

    setupMouseOver()

    setupEverythingDinosaur("trex")


    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onMouseMove, false );

    document.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
}

function setupEverythingDinosaur(dino) {

    if(tabulaModel) {
        tabulaModel.modelCache.children = []
    }

    maleTexture = new DinosaurTexture()
    femaleTexture = new DinosaurTexture()

    currentTexture = maleTexture


    loadAssets(dino)
}

function setupCamera() {
    camera = new PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 0.1, 700 );
    camera.position.set(-3.745472848477101, 0.9616311452213426, -4.53288230701089)
    camera.lookAt(0, 0, 0)
}

function setupMouseOver() {
    textDiv = document.createElement('div');
    let style = textDiv.style

    style.position = 'absolute';

    style.backgroundColor = "black";
    style.color = "white";

    style.fontFamily = "Charcoal,sans-serif";

    style.borderRadius = "20px"

    style.paddingTop = "2px"
    style.paddingBottom = "2px"
    style.paddingRight = "5px"
    style.paddingLeft = "5px"

    style.textTransform = "none"
    document.body.appendChild(textDiv);
}

function setupControls() {
//    Set the controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render )
    controls.enablePan = false //Locks the camera onto the center point. Maybe we can enable this to allow full movement
}

function setupRenderer() {
    //Set up the renderer
    renderer = new WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize( container.clientWidth, container.clientHeight );
    container.appendChild( renderer.domElement );
}

function setupScene() {
    var scene = new Scene();
    scene.background = new Color( 0xaaaaaa );
    scene.add( new HemisphereLight() );

    let dirLight = new DirectionalLight()
    dirLight.position.set( -1.25, 1.5, 1 )
    dirLight.target.position.set( 1, -1, -1 )
    scene.add( dirLight );
    return scene
}

function setupGrid() {
    let geometry = new Geometry();
    geometry.vertices.push(new Vector3( - 15, 0 ) );
    geometry.vertices.push(new Vector3( 15, 0 ) );

    let linesMaterial = new LineBasicMaterial( { color: 0x787878, opacity: .2, linewidth: .1 } );


    gridGroup = new Group()

    for ( let i = 0; i <= 30; i ++ ) {

        let line = new Line( geometry, linesMaterial );
        line.position.z =  i  - 15
        line.position.y = -1.5
        gridGroup.add( line );

        line = new Line( geometry, linesMaterial );
        line.position.x = i - 15
        line.rotation.y = 90 * Math.PI / 180;
        line.position.y = -1.5
        gridGroup.add( line );
    }

    scene.add( gridGroup )

}

export function onWindowResize() {
    let width = container.clientWidth;
    let height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
}

function onMouseMove( event ) {
    rawMouse.x = event.clientX
    rawMouse.y = event.clientY

    let rect = container.getBoundingClientRect()
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
   }
}


function animate() {

    let style = textDiv.style

    let divRect = textDiv.getBoundingClientRect()

    style.left = rawMouse.x - divRect.width/2 + "px" //todo: make it so if there isn't anything selected, don't move this
    style.top = rawMouse.y - 35 + "px"

    animationHandler.animate( clock.getDelta() )
    requestAnimationFrame( animate );
    render();
}

function render() {
    raycaster.setFromCamera( mouse, camera );

    if(tabulaModel) {
        let intersects = raycaster.intersectObjects( tabulaModel.modelCache.children , true );
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

	renderer.render( scene, camera );
}

function getTexture(location) {
    return new Promise(resolve => {
        new TextureLoader().load(location, tex => {
            tex.flipY = false
            tex.magFilter = NearestFilter;
            tex.minFilter = LinearMipMapLinearFilter;
            resolve(tex)
        })
    })
}

async function loadAssets(dinosaur) {
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

    tabulaModel = await parseTBLModel(dinosaur) 
    scene.add (tabulaModel.createModel( material, allCubes,  animationMap))


    maleTexture.setup()
    femaleTexture.setup()

    checkAllCulled()


}

function checkAllCulled() {
    let cacheMap = currentTexture.cullCache
    if(!cacheMap) {
        cacheMap = new Map()
    }
    allCubes.forEach(cube => {

        let index

        if(cacheMap.has(cube.uuid)) {
            index = cacheMap.get(cube.uuid)
        } else {
            let planes = [ 1, 1, 1, 1, 1, 1 ]
            index = []
            for(let face = 0; face < 6; face++) {
                if(!shouldBuild(cube.rawUV[face*4], cube.rawUV[face*4+1], cube.rawUV[face*4+2], cube.rawUV[face*4+3], cube)) {
                    planes[face] = 0
                }
            }
            for(let i = 0; i < planes.length; i++) {
                if(planes[i] === 1) {
                    index.push(...[0, 2, 1, 2, 3, 1].map(v => i*4 + v))
                }
            }
        }
        cacheMap.set(cube.uuid, index)
        cube.setIndex(index)
    })
    currentTexture.cullCache = cacheMap
}

function shouldBuild(x, y, dx, dy, cube) {
    if(dx * dy <= 0) {
        return false
    }
    //Move the getImageData to the DinosaurTexture class?
    let data = currentTexture.pixels.getImageData(x / tabulaModel.texWidth * currentTexture.width, y / tabulaModel.texHeight * currentTexture.height, dx / tabulaModel.texWidth * currentTexture.width, dy / tabulaModel.texHeight * currentTexture.height).data
    for(let index = 0; index < data.length; index+=4) {
        if(data[index+3] != 0) { //Maybe add a threshold
            return true
        }
    }
    return false
}

async function parseTBLModel(dinosaur) {
    let response = await fetch(`assets/${dinosaur}/model.tbl`)
    let data = await response.blob()
    return await TBLModel.loadModel(data)

}

export async function createGif(fps, progressCallback = undefined) {
    return new Promise(resolve => {
        if(!animationHandler.currentIncrement) {
            resolve(undefined)
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
    
        let dummyScene = setupScene()
        dummyScene.background = null
        dummyScene.add(tabulaModel.modelCache)
    
        let dummyCamera = camera.clone()

        dummyCamera.aspect = width / height;
        dummyCamera.updateProjectionMatrix();

        animationHandler.reset()
        
        let started = false
        let delay = 1 / fps
    
        setTimeout(() => {
            while(true) {
                if(animationHandler.poseIndex == 1) {
                    started = true
                }
                if(animationHandler.poseIndex == 0 && started) {
                    break
                }
                animationHandler.animate(delay)
        
                dummyRenderer.render( dummyScene, dummyCamera )
                gif.addFrame(dummyRenderer.domElement, {copy: true, delay: delay * 1000})
        
            }
        
            scene.add(tabulaModel.modelCache)
            
            gif.on("finished", resolve);
            if(progressCallback) {
                gif.on("progress", progressCallback)
            }
            gif.render();
        }, 0)

    })
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


init();
animate();
