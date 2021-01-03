import { Vector3 } from "../three.js";
import { LinkedSelectableList, LinkedElement, ToggleableElement } from "../util.js";

/**
 * The animation gumball.
 */
export class Gumball {
    
    /**
     * @param {*} dom The animation studio dom
     * @param {*} studio the animation studio
     */
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.transformControls = studio.transformControls

        //Starting rot/pos is the starting position/rotation for the selected cube.
        //Used to interpolate properly
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

        //Handle the rotate data. 
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

        //Handle the translate data
        this.transformControls.addEventListener('studioTranslate', e => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }

            selected.cubeGroup.position.copy(e.axis).multiplyScalar(e.length).add(startingPos)
            studio.setPosition(selected.cubeGroup.position.toArray())
            studio.runFrame()
        })

        //Creates the transform type and global mode toggle elements.
        this.transformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).onchange(() => this.selectChanged())
        this.globalMode = new ToggleableElement(dom.find('.transform-control-global')).onchange(e => this.transformControls.space = e.value ? 'world' : 'local')
        
        this.raytracer.addEventListener('selectchange', () => this.selectChanged())
    }

    /**
     * Called when a cube selection changes or the transform type changes.
     */
    selectChanged() {
        this.setMode(this.transformType.value)
    }

    /**
     * Sets the mode for the transform tools, or detaches the transform tools if no cubes are selected.
     * @param {string} mode the mode to set as. Should be `translate` or `rotate`
     */
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