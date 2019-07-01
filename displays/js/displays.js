import { Raycaster, Vector2, PerspectiveCamera, Clock, WebGLRenderer, Scene, Color, HemisphereLight, DirectionalLight, Geometry, Vector3, LineBasicMaterial, Group, Line, TextureLoader, NearestFilter, LinearMipMapLinearFilter, MeshLambertMaterial, DoubleSide } from "./three.js";
import { OrbitControls } from './orbit_controls.js'
import { AnimationHandler } from './animations.js'
import { TBLModel } from './tbl_loader.js'

let camera, scene, renderer, controls, clock;

let container
let mouseDown = false

let gridGroup, textDiv;
let allCubes = []
let animationMap = new Map()

let tabulaModel

let material;

let raycaster = new Raycaster();
let mouse = new Vector2(-5, -5);
let rawMouse = new Vector2();

let dinosaur

let animationHandler = new AnimationHandler(animationMap)

let maleTexture
let femaleTexture
let currentTexture
let isMale = true

//Export things 
window.onAnimationFileChange = files => animationHandler.onAnimationFileChange(files)
window.setInertia = elem => animationHandler.inertia = elem.checked
window.setGrid = elem => gridGroup.visible = elem.checked
window.createGif = (fps) => createGif(fps)
window.setGender = elem => {
    isMale = elem.checked
    currentTexture = isMale ? maleTexture : femaleTexture
    material.map = currentTexture.texture
    material.needsUpdate = true
    checkAllCulled()
}

function init() {

    maleTexture = new DinosaurTexture()
    femaleTexture = new DinosaurTexture()

    currentTexture = maleTexture

    //TODO: when we are public again, this is going to be used to get the dinosaur / pose / pose index to render
    //This can then lead into playing animations maybe?
    dinosaur = getValue("dinosaur", "trex")
//    let pose = getValue("pose", "idle")

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

    loadAssets()

    setupMouseOver()


    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onMouseMove, false );

    document.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
}

function getValue(key, fallback) {
    let matcher = window.location.href.match(new RegExp(key + "=([^&]+)"))
    if(matcher == null || matcher.length == 1) {
        return fallback
    }
    return matcher[1]
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
}

function onMouseUp( event ) {
   mouseDown = false
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
        if(intersects.length > 0 && !mouseDown) {
            let inter = intersects[0]
            textDiv.innerHTML = inter.object.cubeName
            textDiv.style.display = "block"
        } else {
            textDiv.style.display = "none"
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

async function loadAssets() {
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

    tabulaModel = await parseTBLModel() 
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

async function parseTBLModel() {
    let response = await fetch(`assets/${dinosaur}/model.tbl`)
    let data = await response.blob()
    return await TBLModel.loadModel(data)

}

async function createGif(fps) {
    if(!animationHandler.currentIncrement) {
        return
    }

    let width = container.clientWidth
    let height = container.clientHeight

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
    animationHandler.reset()
    
    let started = false
    let delay = 1 / fps //1 / fps

    console.log("started")
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
    console.log("ended")

    scene.add(tabulaModel.modelCache)


    gif.on('finished', function(blob) {
      console.log(blob)
      let url = URL.createObjectURL(blob)
      let a = document.createElement("a");
      a.href = url;
      a.download = "dinosaur.gif"
      a.click()
    });
    
    gif.render();
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
