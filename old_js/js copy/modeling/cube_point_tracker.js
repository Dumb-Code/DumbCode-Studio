import { Mesh, SphereGeometry, MeshBasicMaterial, Quaternion, Vector3, Raycaster, MeshLambertMaterial, BoxBufferGeometry } from "../libs/three.js";
import { raytraceUnderMouse } from "../raytracer.js";

const raycaster = new Raycaster()

const tempPos = new Vector3()
const tempPos2 = new Vector3()
const tempQuaterion = new Quaternion()

const normalColor = 0x23284d
const highlightColor = 0x15c1d4

/**
 * Used to provide a way for other stuff to click on a corner, edge or face of a cube.
 */
export class CubePointTracker {
    constructor(raytracer, display, group) {
        this.raytracer = raytracer
        this.display = display
        this.enabled = false
        this.intersected = null
        this.selected = null
        this.definedCube = null
        this.group = group

        this.normalColor = normalColor
        this.highlightColor = highlightColor
       
        let geometry = new BoxBufferGeometry(1/7, 1/7, 1/7);
        let helperGeometry = new BoxBufferGeometry(1/5, 1/5, 1/5);

        this.points = []
        this.helperPoints = []
        //Helper points, xyz range go in [0, 0.5, 1], with the 0.5 element removed.
        for(let x = 0; x <= 1; x += 0.5) {
            for(let y = 0; y <= 1; y += 0.5) {
                for(let z = 0; z <= 1; z += 0.5) {
                    if(x === .5 && y === .5 && z === .5) {
                        continue                        
                    }

                    //Create the mesh. Helper points (and meshed) and invisible, larger boxes that are used for clicking on.
                    let material = new MeshLambertMaterial({ color: this.normalColor})

                    let mesh = new Mesh(geometry, material)
                    mesh.visible = false
                    group.add(mesh)

                    let helperMesh = new Mesh(helperGeometry, material)
                    helperMesh.visible = false
                    mesh.add(helperMesh)
                    this.helperPoints.push(helperMesh)

                    let point = { x, y, z, mesh }
                    helperMesh._point = point
                    this.points.push( point )
                }
            }
        }

        //When the mouse is dondown, if it's over a point, consume it.
        //Reason it's 10 is because it needs to be after the directional indicators, which is at 0.
        this.display.mousedown.addListener(10, e => {
            if(this.enabled && this.intersected !== null) {
                let intersected = this.intersected
                this.disable()
                this.callback({ point: intersected._point, position: intersected.parent.position })
                e.consume()
            }
        })
    }

    /**
     * Starts the point tracker
     * @param {function} callback the callback for when a point is selected
     * @param {number} normal the normal colour for the cubes
     * @param {number} highlight the highlighted color for the cubes
     * @param {DCMCube} definedCube the forced cube to use insted of the raytracer selected one
     */
    enable(callback = () => {}, normal = normalColor, highlight = highlightColor, definedCube = null) {
        this.enabled = true
        this.definedCube = definedCube
        this.callback = callback
        this.normalColor = normal
        this.highlightColor = highlight
        this.points.forEach(p => p.mesh.material.color.setHex(this.normalColor))
    }

    /**
     * Updates the cube positions and the intersected point.
     */
    update() {
        if(this.enabled && (this.definedCube !== null || this.raytracer.oneSelected() !== null)) {
            let cube = this.definedCube !== null ? this.definedCube : this.raytracer.oneSelected().tabulaCube
  
            let group = cube.cubeMesh
            
            //For each point, set the mesh visible and set the xyz position to the selected (or defined) cube.
            this.points.forEach(p => {
                p.mesh.visible = true

                //Gets the world position of where it should be
                let cg = cube.cubeGrow
                tempPos.set(p.x*(cube.dimension[0]+2*cg[0])/16, p.y*(cube.dimension[1]+2*cg[1])/16, p.z*(cube.dimension[2]+2*cg[2])/16).applyQuaternion(group.getWorldQuaternion(tempQuaterion))
                group.getWorldPosition(p.mesh.position).add(tempPos)
                
                //Used to have the mesh get smaller as it gets further away.
                //The angleBetween and cos is used to make it the right size even when not at the center of the screen
                tempPos2.subVectors(p.mesh.position, tempPos.setFromMatrixPosition(this.display.camera.matrixWorld)).normalize();
                let angleBetween = tempPos2.angleTo(this.display.camera.getWorldDirection(tempPos));
                let eyeDistance = p.mesh.position.distanceTo(tempPos.setFromMatrixPosition(this.display.camera.matrixWorld)) * Math.cos(angleBetween);
                p.mesh.scale.set( 1, 1, 1 ).multiplyScalar( eyeDistance / 7 )
            })

            //Raytrace under every helper point
            this.helperPoints.forEach(p => p.visible = true)
            let intersected = raytraceUnderMouse(this.display.camera, this.helperPoints)
            this.helperPoints.forEach(p => p.visible = false)

            //If intersects any, get the first intersected point (closes).
            if(intersected.length > 0) {
                let closest = intersected[0].object
                //If doesn't equal the current intersected, set the current intersected color to normal, and set the color to highligghed
                if(this.intersected !== closest) {
                    if(this.intersected !== null) {
                        this.intersected.material.color.setHex(this.normalColor)
                    }
                    closest.material.color.setHex(this.highlightColor)
                    this.intersected = closest
                }
            //Nothing intersected. If the current intersected isn't null, reset the color and set it tno null
            } else if(this.intersected !== null) {
                this.intersected.material.color.setHex(this.normalColor)
                this.intersected = null
            } 

        //Not enabled. Hide the meshes
        } else {
            this.points.forEach(p => p.mesh.visible = false)
        }
    }

    /**
     * Disable the point tracker
     */
    disable() {
        this.enabled = false
        this.definedCube = null
        this.intersected = null
    }



}