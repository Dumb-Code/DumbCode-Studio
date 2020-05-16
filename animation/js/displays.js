import { Geometry, Vector3, LineBasicMaterial, Group, Line, Material } from "./three.js";
import { TBLModel } from "./tbl_loader.js";

export class DinosaurDisplay {

    constructor() {
        this.allCubes = []
    }

    setup(renderer, camera, scene) {
        this.renderer = renderer
        this.camera = camera
        this.scene = scene
               
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
            line.position.z =  i - 15
            this.gridGroup.add( line );

            line = new Line(geometry, linesMaterial);
            line.position.x = i - 15
            line.rotation.y = 90 * Math.PI / 180;
            this.gridGroup.add(line);
        }
    }

    /**
     * 
     * @param {Material} material 
     * @param {TBLModel} model 
     */
    setMainModel(material, model) {
        if(this.tbl) {
            this.scene.remove(this.tbl.modelCache)
        }
        this.allCubes.length = 0
        this.tbl = model
        this.scene.add(model.createModel(material))
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export function readFile(file, readerCallback = (reader, file) => reader.readAsBinaryString(file)) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.onload = event => resolve(event.target.result)
        reader.onerror = error => reject(error)
        readerCallback(reader, file)
      })
}
