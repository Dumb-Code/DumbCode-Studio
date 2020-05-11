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
        this.setSelected = setSelected


        document.addEventListener( 'mouseup', e => {
            mouseDown = false
            let xMove = Math.abs(mouseClickDown.x - event.clientX)
            let yMove = Math.abs(mouseClickDown.y - event.clientY)
        
            if(xMove < 5 && yMove < 5 && mouse.x > 0 && mouse.x < 1 && mouse.y > 0 && mouse.y < 1) {
                this.clickOnMesh(this.intersected)
            }
        }, false );
    }
    
    clickOnMesh(mesh) {
        let old = this.selected
        this.selected = mesh
        this.setSelected(old, this.selected)
    }

    mouseOverMesh(mesh) {
        if(mesh !== undefined) {
            if(this.intersected != mesh) {
                if(this.intersected && this.intersected != this.selected) {
                    this.intersected.children.forEach(c => c.material = this.material)
                }
                this.intersected = mesh
                
                if(this.intersected != this.selected) {
                    this.intersected.children.forEach(c => c.material = this.highlightMaterial)
                } 
            } 
        } else if(this.intersected) {
            if(this.intersected != this.selected) {
                this.intersected.children.forEach(c => c.material = this.material)
            }
            this.intersected = undefined
        }
    }

    update() {
        let textDiv = document.getElementById("editor-mouseover") //todo: cache?

        if(this.disableRaycast) {
            return undefined
        }

        if(this.intersected) {
            let style = textDiv.style
            let divRect = textDiv.getBoundingClientRect()
            textDiv.innerHTML = this.intersected.tabulaCube.name
            style.left = rawMouse.x - divRect.width/2 + "px"
            style.top = rawMouse.y - 35 + "px"
        }

        let raycaster = new Raycaster()
        raycaster.setFromCamera(mouse, this.display.camera);
        

        if(this.display.tbl) {
            let intersects = raycaster.intersectObjects(this.display.tbl.modelCache.children , true);
            if(!mouseDown) {
                if(intersects.length > 0) {
                    this.mouseOverMesh(intersects[0].object.parent)
                    textDiv.style.display = "block"
                } else {
                    this.mouseOverMesh(undefined)
                    textDiv.style.display = "none"
                }
            }
        }
    }

}