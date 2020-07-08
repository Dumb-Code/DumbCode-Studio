import { LinkedSelectableList } from "../util.js";

export class Gumball {
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.transformControls = studio.transformControls
        this.transformControls.addEventListener('objectChange', () => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }
            let pos = selected.parent.position
            let rot = selected.parent.rotation

            let rotations = rot.toArray().map(a => a * 180 / Math.PI)
            let positions = [pos.x, pos.y, pos.z]

            studio.setRotation(rotations)
            studio.setPosition(positions)
            studio.runFrame()
        } );

        this.transformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).onchange(() => this.selectChanged())
    }

    selectChanged() {
        this.setMode(this.transformType.value)
    }

    setMode(mode) {
        let selected = this.raytracer.oneSelected()
        if(selected === null || mode === null) {
            this.transformControls.detach()
        } else {
            this.transformControls.attach(selected.parent);
            this.transformControls.mode = mode
        }
    }
}