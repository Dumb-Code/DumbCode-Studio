import { Raycaster, Vector2, Clock, Geometry, Vector3, LineBasicMaterial, Group, Line } from "./three.js";
import { AnimationHandler } from './animations.js'

export class DinosaurDisplay {
    scene;
    renderer;
    clock = new Clock();

    container;

    gridGroup;
    allCubes = [];
    animationMap = new Map();

    tbl;

    animationHandler = new AnimationHandler(this.animationMap)


    setup(container, renderer, camera, scene) {
        if(this.container) {
            this.container.removeChild(this.renderer.domElement)
        }
        this.container = container

        this.renderer = renderer
        this.camera = camera
        this.scene = scene
       
        this.container.appendChild(this.renderer.domElement);
        
        //Set up the grid
        this.gridGroup = new Group()
        this.gridGroup.dontRenderGif = true
        this.scene.add(this.gridGroup)
        let geometry = new Geometry();
        geometry.vertices.push(new Vector3( - 15, 0 ) );
        geometry.vertices.push(new Vector3( 15, 0 ) );
        let linesMaterial = new LineBasicMaterial({ color: 0x787878, opacity: .2, linewidth: .1 });
        for (let i = 0; i <= 30; i ++) {

            let line = new Line(geometry, linesMaterial);
            line.position.z =  i  - 15
            line.position.y = -1.5
            this.gridGroup.add( line );

            line = new Line(geometry, linesMaterial);
            line.position.x = i - 15
            line.rotation.y = 90 * Math.PI / 180;
            line.position.y = -1.5
            this.gridGroup.add(line);
        }
    }

    setMainModel(material, texture, model) {
        if(this.tbl) {
            this.scene.remove(this.tbl.modelCache)
        }
        this.allCubes.length = 0
        this.animationMap.clear()
        this.tbl = model
        this.scene.add(model.createModel(material, this.allCubes, this.animationMap))
        
        this.checkAllCulled(texture)
    }

    display() {
        this.animationHandler.animate(this.clock.getDelta())
        this.render()
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    checkAllCulled(texture) {
        let cacheMap = texture.cullCache
        if(!cacheMap) {
            cacheMap = new Map()
        }
        this.allCubes.forEach(cube => {
    
            let index
    
            if(cacheMap.has(cube.uuid)) {
                index = cacheMap.get(cube.uuid)
            } else {
                let planes = [ 1, 1, 1, 1, 1, 1 ]
                index = []
                for(let face = 0; face < 6; face++) {
                    if(!this.shouldBuild(cube.rawUV[face*4], cube.rawUV[face*4+1], cube.rawUV[face*4+2], cube.rawUV[face*4+3], texture)) {
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
        texture.cullCache = cacheMap
    }

    shouldBuild(x, y, dx, dy, texture) {
        if(dx * dy <= 0) {
            return false
        }
        //Move the getImageData to the DinosaurTexture class?
        let data = texture.pixels.getImageData(
            x / this.tbl.texWidth * texture.width, 
            y / this.tbl.texHeight * texture.height, 
            
            dx / this.tbl.texWidth * texture.width, 
            dy / this.tbl.texHeight * texture.height
        ).data
        for(let index = 0; index < data.length; index+=4) {
            if(data[index+3] != 0) { //Maybe add a threshold
                return true
            }
        }
        return false
    }
}