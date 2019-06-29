    
var camera, scene, renderer, controls;

var container
var mouseDown = false

var gridGroup, textDiv;
var allCubes = []

var tabulaModel

var material;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(-5, -5);
var rawMouse = new THREE.Vector2();

var uvMap = new Map()

var dinosaur

var maleTexture
var femaleTexture

var currentTexture
var isMale = true

function init() {

    maleTexture = new DinosaurTexture()
    femaleTexture = new DinosaurTexture()

    currentTexture = maleTexture

    //TODO: when we are public again, this is going to be used to get the dinosaur / pose / pose index to render
    //This can then lead into playing animations maybe?
    dinosaur = getValue("dinosaur", "trex")
//    var pose = getValue("pose", "idle")

    container = document.createElement( 'div' );
    document.body.appendChild( container );

	setupRenderer()

	if ( ! renderer.extensions.get( 'WEBGL_depth_texture' ) ) {
		document.querySelector( '#error' ).style.display = 'block';
		return;
	}

    setupCamera()

    setupControls()

    setupScene()

    setupTexture()

    setupMouseOver()


    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onMouseMove, false );

    document.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
}

function getValue(key, fallback) {
    var matcher = window.location.href.match(new RegExp(key + "=([^&]+)"))
    if(matcher == null || matcher.length == 1) {
        return fallback
    }
    return matcher[1]
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 0.1, 700 );
    camera.position.set(-3.745472848477101, 0.9616311452213426, -4.53288230701089)
    camera.lookAt(0, 0, 0)
}

function setupMouseOver() {
    textDiv = document.createElement('div');
    var style = textDiv.style

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
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render )
    controls.enablePan = false //Locks the camera onto the center point. Maybe we can enable this to allow full movement
}

function setupRenderer() {
    //Set up the renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xaaaaaa );
    scene.add( new THREE.HemisphereLight() );

    var dirLight = new THREE.DirectionalLight()
    dirLight.position.set( -1.25, 1.5, 1 )
    dirLight.target.position.set( 1, -1, -1 )
    scene.add( dirLight );

    setupGrid()
}

function setupGrid() {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( - 15, 0 ) );
    geometry.vertices.push(new THREE.Vector3( 15, 0 ) );

    var linesMaterial = new THREE.LineBasicMaterial( { color: 0x787878, opacity: .2, linewidth: .1 } );


    gridGroup = new THREE.Group()

    for ( var i = 0; i <= 30; i ++ ) {

        var line = new THREE.Line( geometry, linesMaterial );
        line.position.z =  i  - 15
        line.position.y = -1.5
        gridGroup.add( line );

        line = new THREE.Line( geometry, linesMaterial );
        line.position.x = i - 15
        line.rotation.y = 90 * Math.PI / 180;
        line.position.y = -1.5
        gridGroup.add( line );
    }

    scene.add( gridGroup )

    gridToggle()
}

function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
}

function onMouseMove( event ) {
    rawMouse.x = event.clientX
    rawMouse.y = event.clientY

    var rect = container.getBoundingClientRect()
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

    var style = textDiv.style

    var divRect = textDiv.getBoundingClientRect()

    style.left = rawMouse.x - divRect.width/2 + "px" //todo: make it so if there isn't anything selected, don't move this
    style.top = rawMouse.y - 35 + "px"

    requestAnimationFrame( animate );
    render();
}

function render() {

    raycaster.setFromCamera( mouse, camera );

    if(tabulaModel.modelCache) {
        var intersects = raycaster.intersectObjects( tabulaModel.modelCache.children , true );
        if(intersects.length > 0 && !mouseDown) {
            var inter = intersects[0]
            textDiv.innerHTML = inter.object.cubeName
            textDiv.style.display = "block"
        } else {
            textDiv.style.display = "none"
        }
    }

	renderer.render( scene, camera );
}

function setupTexture() {
    new THREE.TextureLoader().load("assets/" + dinosaur + "/female.png", function( fTexture ) {
            fTexture.flipY = false
            fTexture.magFilter = THREE.NearestFilter;
            fTexture.minFilter = THREE.LinearMipMapLinearFilter;
            femaleTexture.texture = fTexture


            new THREE.TextureLoader().load("assets/" + dinosaur + "/male.png", function( mTexture ) {
                mTexture.flipY = false
                mTexture.magFilter = THREE.NearestFilter;
                mTexture.minFilter = THREE.LinearMipMapLinearFilter;
                maleTexture.texture = mTexture


                material = new THREE.MeshLambertMaterial( {
                    color: 0xAAAAAA,
                	map: mTexture,
                	transparent: true,
                	side: THREE.DoubleSide,
                } )



                parseTBLModel("nada") //todo: have model name here. Infer it from the document

                //todo: move this to it's own inner class method
                maleTexture.setup(mTexture.image)
                femaleTexture.setup(fTexture.image)
            })


        })

}

function checkAllCulled() {
    allCubes.forEach(cube => {

        var p = [ 1, 1, 1, 1, 1, 1 ]; // planes px,nx, py,ny, pz,nz  -> 0 hide, 1 show
        var index = [];

        for(var face = 0; face < 6; face++) {


            if(!shouldBuild(cube.rawUV[face*4], cube.rawUV[face*4+1], cube.rawUV[face*4+2], cube.rawUV[face*4+3], cube)) {
                p[face] = 0
            }

        }

         if ( p[0] === 1 ) index.push( 0, 2, 1, 2, 3, 1 );
         if ( p[1] === 1 ) index.push( 4, 6, 5, 6, 7, 5 );
         if ( p[2] === 1 ) index.push( 8, 10, 9, 10, 11, 9 )
         if ( p[3] === 1 ) index.push( 12, 14, 13, 14, 15, 13 );
         if ( p[4] === 1 ) index.push( 16, 18, 17, 18, 19, 17 );
         if ( p[5] === 1 ) index.push( 20, 22, 21, 22, 23, 21 );

         cube.setIndex( index )
    })
}

function shouldBuild(x, y, dx, dy, cube) {
    if(dx * dy <= 0) {
        return false
    }
    //Move the getImageData to the DinosaurTexture class?
    var data = currentTexture.pixels.getImageData(x / tabulaModel.texWidth * currentTexture.width, y / tabulaModel.texHeight * currentTexture.height, dx / tabulaModel.texWidth * currentTexture.width, dy / tabulaModel.texHeight * currentTexture.height).data
    for(var index = 0; index < data.length; index+=4) {
        if(data[index+3] != 0) { //Maybe add a threshold
            return true
        }
    }
    return false
}

function parseTBLModel(model) {

    JSZipUtils.getBinaryContent('assets/' + dinosaur + '/model.tbl', function(err, data) {
        if(err) {
            throw err; // or handle err
        }

        JSZip.loadAsync(data).then(function (zip) {
            zip.file("model.json").async("string")
            .then(function success(content) {

                tabulaModel = new TBLModel(content)

                scene.add (tabulaModel.createModel( material, [],  new Map()))


            }, function error(e) {
                console.log(e)
            })
        });
    });
}


function gridToggle() {
    gridGroup.visible = document.getElementById('grid').checked
}

function genderToggle() {

    if(isMale) {
        currentTexture = femaleTexture
    } else {
        currentTexture = maleTexture
    }
    isMale = !isMale


    material.map = currentTexture.texture
    material.needsUpdate = true

    checkAllCulled() //todo: cache this on the class?
}

class DinosaurTexture {
    setup( img ) {
        var canvas = document.createElement('canvas');
        this.width = img.width;
        this.height = img.height;

        canvas.width = this.width
        canvas.height = this.height

        this.pixels = canvas.getContext('2d')
        this.pixels.drawImage(img, 0, 0, this.width, img.height);

    }
}


init();
animate();
