import { Mesh, SphereGeometry, MeshBasicMaterial, Quaternion, Vector3, Raycaster } from "../three.js";
import { raytraceUnderMouse } from "../raytracer.js";

const raycaster = new Raycaster()

const tempPos = new Vector3()
const tempQuaterion = new Quaternion()

const normalColor = 0x6378ad
const highlightColor = 0x15c1d4
const selectColor = 0xd11573

export class CubePointTracker {
    constructor(raytracer, display, group) {
        this.raytracer = raytracer
        this.display = display
        this.enabled = false
        this.intersected = null
        this.selected = null
        this.definedCube = null
        this.group = group
       
        let geometry = new SphereGeometry(1/15, 32, 32);
        let helperGeometry = new SphereGeometry(1/10, 32, 32);

        this.points = []
        this.helperPoints = []
        for(let x = 0; x <= 1; x += 0.5) {
            for(let y = 0; y <= 1; y += 0.5) {
                for(let z = 0; z <= 1; z += 0.5) {
                    if(x === .5 && y === .5 && z === .5) {
                        continue                        
                    }

                    let material = new MeshBasicMaterial({ color: normalColor})

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

        $(document).mousedown(() => {
            if(this.enabled && this.intersected !== null) {
                this.disable()
                this.callback({ point: this.intersected._point, position: this.intersected.parent.position })
            }
        })
    }

    enable(callback = () => {}, definedCube = null) {
        this.enabled = true
        this.definedCube = definedCube
        this.callback = callback
    }

    update() {
        if(this.enabled && (this.definedCube !== null || this.raytracer.intersected !== undefined)) {
            let cube = this.definedCube !== null ? this.definedCube : this.raytracer.intersected.tabulaCube
            let group = cube.cubeMesh
            
            this.points.forEach(p => {
                p.mesh.visible = true
                tempPos.set(p.x*cube.dimension[0]/16, p.y*cube.dimension[1]/16, p.z*cube.dimension[2]/16).applyQuaternion(group.getWorldQuaternion(tempQuaterion))
                group.getWorldPosition(p.mesh.position).add(tempPos)
                
                let eyeDistance = p.mesh.position.distanceTo(tempPos.setFromMatrixPosition(this.display.camera.matrixWorld));
                p.mesh.scale.set( 1, 1, 1 ).multiplyScalar( eyeDistance / 7 );
            })

            this.helperPoints.forEach(p => p.visible = true)
            let intersected = raytraceUnderMouse(this.display.camera, this.helperPoints)
            this.helperPoints.forEach(p => p.visible = false)
            if(intersected.length > 0) {
                let closest = intersected[0].object
                if(true) {//intersected[0].distance < this.raytracer.intersectedDistance || this.raytracer.intersectedDistance === -1
                    if(this.intersected !== closest) {
                        if(this.intersected !== null) {
                            this.intersected.material.color.setHex(normalColor)
                        }
                        closest.material.color.setHex(highlightColor)

                        this.intersected = closest
                    }
                }
            } else if(this.intersected !== null) {
                this.intersected.material.color.setHex(normalColor)
                this.intersected = null
            } 

        } else {
            this.points.forEach(p => p.mesh.visible = false)
        }
    }

    disable() {
        this.enabled = false
        this.definedCube = null
    }



}