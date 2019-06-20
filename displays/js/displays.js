var camera, scene, renderer;

var mainCubeGroup, textureMap;

var texWidth, texHeight;

var uvMap = new Map()

init();
animate();

function init() {

    //TODO: when we are public again, this is going to be used to get the dinosaur / pose / pose index to render
    //This can then lead into playing animations maybe?
//    var dinosaur = getValue("dinosaur", "tyrannosaurus")
//    var pose = getValue("pose", "idle")

	setupRenderer()

	if ( ! renderer.extensions.get( 'WEBGL_depth_texture' ) ) {
		document.querySelector( '#error' ).style.display = 'block';
		return;
	}

    setupCamera()

    setupControls()

    setupScene()

    setupTexture()

	window.addEventListener( 'resize', onWindowResize, false );
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

function setupControls() {
//    Set the controls
    var controls = new THREE.OrbitControls( camera, renderer.domElement );
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
    document.body.appendChild( renderer.domElement );
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xaaaaaa );
    scene.add( new THREE.HemisphereLight() );

    var dirLight = new THREE.DirectionalLight()
    dirLight.position.set( -1.25, 1.5, 1 )
    dirLight.target.position.set( 1, -1, -1 )
    scene.add( dirLight );
}

function onWindowResize() {
	var width = window.innerWidth;
	var height = window.innerHeight;
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize( width, height );
	composer.setSize( width, height );
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
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


