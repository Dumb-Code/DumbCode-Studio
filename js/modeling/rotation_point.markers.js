import { Group, SphereGeometry, MeshBasicMaterial, Mesh } from "../three.js"

export class RotationPointMarkers {

    constructor(studio) {
        this.raytracer = studio.raytracer
        studio.group.add(this.rotationPointSpheres = new Group())
        studio.transformControls.addEventListener('objectChange', () => this.updateSpheres())
    }

    updateSpheres() {
        this.rotationPointSpheres.children.forEach(child => {
            if(child.linkedUpObject !== undefined) {
                child.position.setFromMatrixPosition(child.linkedUpObject.matrixWorld)
            }
        })
    }

    selectChanged() {
        this.rotationPointSpheres.remove(...this.rotationPointSpheres.children)
        this.raytracer.selectedSet.forEach(cube => {
            let sph = this.createRotationPointObject()
            this.rotationPointSpheres.add(sph)
            sph.linkedUpObject = cube.tabulaCube.cubeGroup
            sph.position.setFromMatrixPosition(cube.tabulaCube.cubeGroup.matrixWorld)
        })
    }

    createRotationPointObject() {
        let geometry = new SphereGeometry(1/32, 32, 32);
        let material = new MeshBasicMaterial({ color: 0x0624cf});
        return new Mesh(geometry, material);
    }

}