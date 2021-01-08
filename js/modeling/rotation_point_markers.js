import { Group, SphereGeometry, MeshBasicMaterial, Mesh, Vector3, EdgesGeometry, BoxBufferGeometry, LineBasicMaterial, Line, LineSegments, Matrix4 } from "../libs/three.js"

const tempPos = new Vector3()
const tempPos2 = new Vector3()

//The rotation point markers
const bufferBoxGeometry = new BoxBufferGeometry()
bufferBoxGeometry.applyMatrix(new Matrix4().makeTranslation(0.5, 0.5, 0.5))

/**
 * Used to visulize the rotation point markers and the cube outlines when selected.
 * @todo: don't use `linkedUpObject`, as when undo/redo, it won't reference the correct object.
 */
export class RotationPointMarkers {

    constructor(studio) {
        this.display = studio.display
        this.raytracer = studio.raytracer
        this.spheres = []
        this.outlines = []

        this.createdObjects = [] //An array of all created objects not in use
        this.inUseObjects = [] //An array of all created objects in use

        //Create the group
        studio.group.add(this.group = new Group())
        studio.transformControls.addEventListener('objectChange', () => this.onFrame())
    }

    /**
     * Ran every frame
     */
    onFrame() {
        //For every sphere, set the position to the world position of the element.
        this.spheres.forEach(sphere => {
            if(sphere.linkedUpObject !== undefined) {
                sphere.position.setFromMatrixPosition(sphere.linkedUpObject.matrixWorld)
            }

            //Scale as it gets further away from the camera
            tempPos2.subVectors(sphere.position, tempPos.setFromMatrixPosition(this.display.camera.matrixWorld)).normalize();
            let angleBetween = tempPos2.angleTo(this.display.camera.getWorldDirection(tempPos));
            let eyeDistance = sphere.position.distanceTo(tempPos.setFromMatrixPosition(this.display.camera.matrixWorld)) * Math.cos(angleBetween);
            sphere.scale.set( 1, 1, 1 ).multiplyScalar( eyeDistance / 3 )
        })
        
        this.outlines.forEach(outline => {
            if(outline.linkedUpObject !== undefined) {
                //Set the position and rotation, and get the dimensions
                outline.linkedUpObject.matrixWorld.decompose(outline.position, outline.quaternion, tempPos)
                outline.rotation.setFromQuaternion(outline.quaternion)
                outline.scale.copy(outline.linkedUpObject.scale).divideScalar(16)
            }
        })
    }
 
    /**
     * Used when the raytracer select change happens
     */
    selectChanged() {
        this.group.remove(...this.spheres)
        this.group.remove(...this.outlines)

        //Add all in use objects to the not in use array
        this.createdObjects.push(...this.inUseObjects)

        this.inUseObjects.length = 0
        this.spheres.length = 0
        this.outlines.length = 0

        this.raytracer.selectedSet.forEach(cube => {

            let obj
            //If the created objects has any more, use it, otherwise create a new object.
            if(this.createdObjects.length == 0) {
                obj = { sphere: this.createRotationPointObject(), outline: this.createOutlineObject() }
            } else {
                obj = this.createdObjects.splice(0, 1)[0]
            }

            this.inUseObjects.push(obj)

            let sph = obj.sphere
            let out = obj.outline

            this.group.add(sph)
            this.spheres.push(sph)

            this.group.add(out)
            this.outlines.push(out)

            sph.linkedUpObject = cube.tabulaCube.cubeGroup
            out.linkedUpObject = cube.tabulaCube.cubeMesh

            sph.position.setFromMatrixPosition(cube.tabulaCube.cubeGroup.matrixWorld)
            out.position.setFromMatrixPosition(cube.tabulaCube.cubeGroup.matrixWorld)
        })

        this.onFrame()
    }

    /**
     * Creates a rotation point object
     */
    createRotationPointObject() {
        let geometry = new SphereGeometry(1/32, 32, 32);
        let material = new MeshBasicMaterial({ color: 0x0624cf});
        return new Mesh(geometry, material);
    }

    /**
     * Creates an outline object
     */
    createOutlineObject() {
        let gometry = new EdgesGeometry(bufferBoxGeometry)
        let material = new LineBasicMaterial({ color: 0x0624cf })
        return new LineSegments(gometry, material)
    }

}