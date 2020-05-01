import { Vector2, Raycaster } from "./three.js";

const canvasContainer = document.getElementById("display-div");

document.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'mousedown', onMouseDown, false );

let mouse = new Vector2(-5, -5);
let mouseClickDown = new Vector2(-5, -5)
let rawMouse = new Vector2();
let mouseDown = false

function onMouseMove( event ) {
    rawMouse.x = event.clientX
    rawMouse.y = event.clientY

    let rect = canvasContainer.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

}

function onMouseDown( event ) {
   mouseDown = true
   mouseClickDown.x = event.clientX
   mouseClickDown.y = event.clientY
}


export class Raytracer {

    constructor(display, material, highlightMaterial, setSelected) {
        this.material = material
        this.highlightMaterial = highlightMaterial
        this.display = display
        this.selected
        this.intersected
        this.disableRaycast = false


        document.addEventListener( 'mouseup', e => {
            mouseDown = false
            let xMove = Math.abs(mouseClickDown.x - event.clientX)
            let yMove = Math.abs(mouseClickDown.y - event.clientY)
        
            if(this.intersected && (xMove < 5 || yMove < 5)) {
                let old = this.selected
                this.selected = this.intersected
                setSelected(old, this.selected)
            }
        }, false );


    }

    update() {
        let textDiv = document.getElementById("editor-mouseover") //todo: cache?

        if(this.disableRaycast) {
            return undefined
        }

        if(this.intersected) {
            let style = textDiv.style
            let divRect = textDiv.getBoundingClientRect()
            style.left = rawMouse.x - divRect.width/2 + "px"
            style.top = rawMouse.y - 35 + "px"
        }

        let raycaster = new Raycaster()
        raycaster.setFromCamera(mouse, this.display.camera);

        if(this.display.tbl) {
            let intersects = raycaster.intersectObjects(this.display.tbl.modelCache.children , true);
            if(!mouseDown && !document.getElementById("modal-settings").classList.contains("is-active")) {
                if(intersects.length > 0) {
                    if(this.intersected != intersects[0].object) {
                        if(this.intersected && this.intersected != this.selected) {
                            this.intersected.material = this.material
                        }
            
                        this.intersected = intersects[0].object
                        textDiv.innerHTML = this.intersected.tabulaCube.name
                        
                        if(this.intersected != this.selected) {
                            this.intersected.material = this.highlightMaterial
                        } 
                    } 
                    textDiv.style.display = "block"
                } else {
                    if(this.intersected && this.intersected != this.selected) {
                        this.intersected.material = this.material
                        this.intersected = null
                    }
                    textDiv.style.display = "none"
                }
            }
        }
    }

}