import { Vector3 } from "../three.js";
import { LinkedSelectableList, LinkedElement, ToggleableElement } from "../util.js";

export class Gumball {
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.transformControls = studio.transformControls

        let startingRot = new Vector3()
        let startingPos = new Vector3()
        this.transformControls.addEventListener('mouseDown', () => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }

            startingRot.x = selected.cubeGroup.rotation.x
            startingRot.y = selected.cubeGroup.rotation.y
            startingRot.z = selected.cubeGroup.rotation.z

            startingPos.copy(selected.cubeGroup.position)
        })
        this.transformControls.addEventListener('studioRotate', e => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }

            let rot = selected.cubeGroup.rotation
            rot.x = startingRot.x + e.rotationAngle * e.rotationAxis.x
            rot.y = startingRot.y + e.rotationAngle * e.rotationAxis.y
            rot.z = startingRot.z + e.rotationAngle * e.rotationAxis.z

            let rotations = rot.toArray().map(a => a * 180 / Math.PI)
            studio.setRotation(rotations)
            studio.runFrame()
        })
        this.transformControls.addEventListener('studioTranslate', e => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }

            selected.cubeGroup.position.copy(e.axis).multiplyScalar(e.length).add(startingPos)
            studio.setPosition(selected.cubeGroup.position.toArray())
            studio.runFrame()
        })

        this.transformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).onchange(() => this.selectChanged())
        this.globalMode = new ToggleableElement(dom.find('.transform-control-global')).onchange(e => this.transformControls.space = e.value ? 'world' : 'local')
        this.raytracer.addEventListener('selectchange', () => this.selectChanged())
    }

    selectChanged() {
        this.setMode(this.transformType.value)
    }

    setMode(mode) {
        let selected = this.raytracer.oneSelected()
        if(selected === null || mode === null || mode === undefined) {
            this.transformControls.detach()
        } else {
            this.transformControls.attach(selected.parent);
            this.transformControls.mode = mode
        }
    }
}