import { Geometry, Vector3, LineBasicMaterial, Group, Line, Material, BoxBufferGeometry, MeshBasicMaterial, Mesh, CylinderBufferGeometry, Matrix4 } from "./three.js";
import { TBLModel } from "./tbl_loader.js";

export class DinosaurDisplay {

    constructor() {
        this.allCubes = []
    }

    setup(renderer, camera, scene) {
        this.renderer = renderer
        this.camera = camera
        this.scene = scene
               

        let gridSquares = 7
        //Set up the grid
        this.gridGroup = new Group()
        this.gridGroup.dontRenderGif = true
        this.scene.add(this.gridGroup)
        let matrix = new Matrix4().makeRotationZ(Math.PI / 2)
        let mesh1 = new Mesh(new CylinderBufferGeometry(0.005, 0.005, gridSquares), new MeshBasicMaterial({ color: 0x2C2C2C }))
        let mesh2 = new Mesh(new CylinderBufferGeometry(0.003, 0.003, gridSquares), new MeshBasicMaterial({ color: 0x5A5A5A }))
        let mesh3 = new Mesh(new CylinderBufferGeometry(0.002, 0.002, gridSquares), new MeshBasicMaterial({ color: 0x7B7B7B }))

        mesh1.geometry.applyMatrix(matrix);
        mesh2.geometry.applyMatrix(matrix);
        mesh3.geometry.applyMatrix(matrix);

        for (let i = 0; i <= gridSquares; i ++) {
            let line = mesh1.clone()
            line.position.z =  i - gridSquares/2
            this.gridGroup.add( line );

            line = mesh1.clone()
            line.position.x = i - gridSquares/2
            line.rotation.y = 90 * Math.PI / 180;
            this.gridGroup.add(line);
            
            if(i === 0) {
                continue
            }
            for(let i2 = 1; i2 <= 4; i2++) {
                if(i2 !== 0 && i2 !== 4) {
                    let line = mesh2.clone()
                    line.position.z =  i - gridSquares/2 - i2/4
                    this.gridGroup.add( line );

                    line = mesh2.clone()
                    line.position.x = i - gridSquares/2 - i2/4
                    line.rotation.y = 90 * Math.PI / 180;
                    this.gridGroup.add(line);
                }

                for(let i3 = 1; i3 < 4; i3++) {
                    let line = mesh3.clone()
                    line.position.z =  i - gridSquares/2 - i2/4 - i3/16 + 1/4
                    this.gridGroup.add( line );
    
                    line = mesh3.clone()
                    line.position.x = i - gridSquares/2 - i2/4 - i3/16 + 1/4
                    line.rotation.y = 90 * Math.PI / 180;
                    this.gridGroup.add(line);
                }

            }
        }

        let blockGeometry = new BoxBufferGeometry()
        let blockMaterial = new MeshBasicMaterial({ color: 0x2251A9 })
        this.blockElement = new Mesh(blockGeometry, blockMaterial)
        this.blockElement.position.set(0, -0.5001, 0)
        this.scene.add(this.blockElement)
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
