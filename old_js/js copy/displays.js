import { Geometry, Vector3, LineBasicMaterial, Group, Line, Material, BoxBufferGeometry, MeshBasicMaterial, Mesh, CylinderBufferGeometry, Matrix4, MeshLambertMaterial } from "./libs/three.js";
import { WeightedEventHandler } from "./util.js";

const vector = new Vector3()

/**
 * Holds the information about the scene
 */
export class DinosaurDisplay {

    constructor() {
        this.drawWidth = 1
        this.drawHeight = 1

        //The mouse down event handler
        this.mousedown = new WeightedEventHandler()
    }

    /**
     * Sets up the scene
     */
    setup(renderer, camera, scene, onTopScene, directionalIndecators) {
        this.renderer = renderer
        this.camera = camera
        this.scene = scene
        this.onTopScene = onTopScene
        this.directionalIndecators = directionalIndecators
               
        let gridSquares = 7
        //Set up the grid
        this.gridGroup = new Group()
        this.gridGroup.dontRenderGif = true
        this.scene.add(this.gridGroup)
        let matrix = new Matrix4().makeRotationZ(Math.PI / 2)
        let mesh1 = new Mesh(new CylinderBufferGeometry(0.005, 0.005, gridSquares - 1), new MeshBasicMaterial({ color: 0x121212 }))
        let mesh2 = new Mesh(new CylinderBufferGeometry(0.003, 0.003, gridSquares - 1), new MeshBasicMaterial({ color: 0x1c1c1c }))
        let mesh3 = new Mesh(new CylinderBufferGeometry(0.002, 0.002, gridSquares - 1), new MeshBasicMaterial({ color: 0x292929 }))

        mesh1.geometry.applyMatrix(matrix);
        mesh2.geometry.applyMatrix(matrix);
        mesh3.geometry.applyMatrix(matrix);

        for (let i = 0; i < gridSquares; i ++) {
            let line = mesh1.clone()
            line.position.z =  i - gridSquares/2 + 1
            line.position.x = 0.5
            this.gridGroup.add( line );

            line = mesh1.clone()
            line.position.x = i - gridSquares/2 + 1
            line.position.z = 0.5
            line.rotation.y = 90 * Math.PI / 180
            this.gridGroup.add(line);
            
            if(i === 0) {
                continue
            }
            for(let i2 = 1; i2 <= 4; i2++) {
                if(i2 !== 0 && i2 !== 4) {
                    let line = mesh2.clone()
                    line.position.z =  i - gridSquares/2 + 1 - i2/4
                    line.position.x = 0.5
                    this.gridGroup.add( line );

                    line = mesh2.clone()
                    line.position.x = i - gridSquares/2 + 1 - i2/4
                    line.rotation.y = 90 * Math.PI / 180;
                    line.position.z = 0.5
                    this.gridGroup.add(line);
                }

                for(let i3 = 1; i3 < 4; i3++) {
                    let line = mesh3.clone()
                    line.position.z =  i - gridSquares/2 + 1 - i2/4 - i3/16 + 1/4
                    line.position.x = 0.5
                    this.gridGroup.add( line );
    
                    line = mesh3.clone()
                    line.position.x = i - gridSquares/2 + 1 - i2/4 - i3/16 + 1/4
                    line.position.z = 0.5
                    line.rotation.y = 90 * Math.PI / 180;
                    this.gridGroup.add(line);
                }

            }
        }

        //Create the bounding box
        let blockGeometry = new BoxBufferGeometry()
        let blockMaterial = new MeshLambertMaterial({ color: 0x2251A9 })
        this.blockElement = new Mesh(blockGeometry, blockMaterial)
        this.blockElement.position.set(0.5, -0.5001, 0.5)
        this.scene.add(this.blockElement)
    }

    /**
     * Toggle the grid visability
     */
    toggleGrid() {
        this.gridGroup.visible = !this.gridGroup.visible
    }

    /**
     * Toggle the block visability
     */
    toggleBlock() {
        this.blockElement.visible = !this.blockElement.visible
    }

    /**
     * Sets the renderer size
     * @param {number} width the width
     * @param {number} height the height
     */
    setSize(width, height) {
        this.drawWidth = width
        this.drawHeight = height
        this.renderer.setSize(width, height)
    }

    /**
     * Gets the screen coordinate of an object
     * @param {*} obj the three object to test on
     * @param {*} camera the camera to use
     */
    toScreenPosition(obj, camera = this.camera) {

        obj.updateMatrixWorld()
        vector.setFromMatrixPosition(obj.matrixWorld)
        vector.project(camera)

        vector.x = ( vector.x / 2 ) + 0.5
        vector.y = - ( vector.y / 2 ) + 0.5

        return { 
            x: vector.x,
            y: vector.y
        }
    }

    /**
     * Renders everything.
     */
    render() {
        this.renderer.render(this.scene, this.camera);
        if(this.onTopScene) {
            this.renderer.clearDepth()
            this.renderer.render(this.onTopScene, this.camera);
        }
        
        if(this.directionalIndecators) {
            this.directionalIndecators.draw()
        }
    }
}

/**
 * Why is this here.
 * Helper method to read a file
 * @param {*} file the file to read
 * @param {*} readerCallback the reading callback
 */
export function readFile(file, readerCallback = (reader, file) => reader.readAsArrayBuffer(file)) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.onload = event => resolve(event.target.result)
        reader.onerror = error => reject(error)
        readerCallback(reader, file)
      })
}
