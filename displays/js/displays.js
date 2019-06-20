var camera, scene, renderer, controls;

var container

var mainCubeGroup, gridGroup, textureMap, textDiv;

var texWidth, texHeight;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(-5, -5);
var rawMouse = new THREE.Vector2();

var uvMap = new Map()

init();
animate();

function init() {

    //TODO: when we are public again, this is going to be used to get the dinosaur / pose / pose index to render
    //This can then lead into playing animations maybe?
//    var dinosaur = getValue("dinosaur", "tyrannosaurus")
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


function animate() {

    var style = textDiv.style

    var divRect = textDiv.getBoundingClientRect()

    style.left = rawMouse.x - divRect.width/2 + "px"
    style.top = rawMouse.y - 35 + "px"

	requestAnimationFrame( animate );
	render();
}

function render() {

    raycaster.setFromCamera( mouse, camera );

    if(mainCubeGroup) {
        var intersects = raycaster.intersectObjects( mainCubeGroup.children, true );
        if(intersects.length > 0) {
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
    new THREE.TextureLoader().load("assets/male_adult.png", function( texture ) {
        texture.flipY = false
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        textureMap = texture;
        parseTBLModel("nada") //todo: have model name here. Infer it from the document
    })
}







function parseTBLModel(model) {

    JSZipUtils.getBinaryContent('assets/dinosaur.tbl', function(err, data) {
        if(err) {
            throw err; // or handle err
        }

        JSZip.loadAsync(data).then(function (zip) {
            zip.file("model.json").async("string")
            .then(function success(content) {

                var jobj = JSON.parse(content)

                mainCubeGroup = new THREE.Group();

                texWidth = jobj.textureWidth
                texHeight = jobj.textureHeight


                for (var cube in jobj.cubes) {
                    mainCubeGroup.add(parseCube(jobj.cubes[cube]))
                }

                var dummyGroup = new THREE.Group();
                dummyGroup.scale.set(-1/16, -1/16, 1/16)
                dummyGroup.add (mainCubeGroup)
                scene.add (dummyGroup)

            }, function error(e) {
                console.log(e)
            })
        });
    });
}

function parseCube(cubeJson) {
    var material = new THREE.MeshLambertMaterial( {
        color: 0xAAAAAA,
		map: textureMap,
		transparent: true,
		side: THREE.FrontSide
	} );

    var group = new THREE.Group();

    var internalGroup = new THREE.Group();
    group.add(internalGroup)

    var dimensions = cubeJson.dimensions
    var offset = cubeJson.offset
    var position = cubeJson.position
    var rotation = cubeJson.rotation

    var geometry = new THREE.BoxBufferGeometry( dimensions[0], dimensions[1], dimensions[2] );

    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(getUV(cubeJson.txOffset[0], cubeJson.txOffset[1], dimensions[0], dimensions[1], dimensions[2], geometry.getAttribute("uv"))), 2))

    var cube = new THREE.Mesh( geometry, material )
    cube.position.set( dimensions[0] / 2 + offset[0], dimensions[1] / 2 + offset[1], dimensions[2] / 2 + offset[2] )
    cube.cubeName = cubeJson.name
    internalGroup.add( cube )


    group.position.set(position[0], position[1], position[2])

    group.rotation.order = "ZYX"
    group.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)

    for(var child in cubeJson.children) {
        group.add(parseCube(cubeJson.children[child]))
    }


    return group
}

function getUV(offsetX, offsetY, w, h, d, dat) {

    //Uv data goes west, east, down, up, south north

    //6 -> 6 faces
    //4 -> 4 vertices per face
    //2 -> 2 data per vertex (u, v)
    var uvdata = new Array(6 * 4 * 2)

    var texBottomOrder = [ 1, 5, 0, 4 ]
    var texUpperOrder = [3, 2]

    var offX = 0
    for(var texh = 0; texh < texBottomOrder.length; texh++) {
        var minX = offsetX + offX
        var minY = offsetY + d

        var xDist = w;
        if (texh % 2 == 0) {
            xDist = d
        }
        offX += xDist

        putUVData(uvdata, texBottomOrder[texh], minX, minY, xDist, h)

    }

    for(var texb = 0; texb < texUpperOrder.length; texb++) {
        var minXLower = offsetX + d + w * texb + w
        if(texb == 0) { //up
            putUVData(uvdata, texUpperOrder[texb], minXLower, offsetY+d, -w, -d)
        } else { //Down
            putUVData(uvdata, texUpperOrder[texb], minXLower, offsetY, -w, d)
        }
    }


    return uvdata
}

function putUVData(uvdata, facingindex, minU, minV, uSize, vSize) {
    //1 0 1 0
    //1 1 0 0
    var u = [minU + uSize, minU, minU + uSize, minU]
    var v = [minV + vSize, minV + vSize, minV, minV]
    for(var vertex = 0; vertex < 4; vertex++) {
        var index = (facingindex * 4 + vertex) * 2
        uvdata[index] = u[vertex] / texWidth
        uvdata[index + 1] = v[vertex] / texHeight
    }
}


function gridToggle() {
    gridGroup.visible = document.getElementById('grid').checked
}

