import { CanvasTransformControls } from "../util/canvas_transform_controls.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"

//The radius of the circles
const radius = 7.5

/**
 * Handles the cube progression canvas.
 */
export class ProgressionCanvas {
    constructor(dom, studio) {
        this.pth = studio.pth
        //The selected progression point
        this.selectedPoint = null
        this.dropdownText = dom.find('.dropdown-text')

        //Whether the easing mode has been set
        this.easingRequiresChoice = true

        //Get the canvas and the context, and create the canvas transform controls.
        let pc = dom.find('#progression_canvas')
        this.progressionCanvas = pc.get(0)
        this.canvasCtx = this.progressionCanvas.getContext("2d")
        this.canvasTransformControls = new CanvasTransformControls(this.progressionCanvas, (a, b, c, d, e) => this.mouseOverCanvas(a, b, c, d, e), 1, () => this.redrawProgressionCanvas())

        //The easing function entries
        this.easingFunction = new LinkedSelectableList(dom.find('.easing-function-entry')).onchange(e => {
            this.dropdownText.text(e.elements.text())
            this.easingRequiresChoice = false
            this.generateEasingFunction()
        })
        //The easing function quality slider.
        this.easingFunctionQuality = dom.find('.easing-function-quality').on('input', () => {
            let val = this.easingFunctionQuality.val()
            //Update the tooltip
            let qual
            if (val <= 10) {
                qual = "Normal"
            } else if(val <= 20) {
                qual = "High"
            } else if(val <= 30) {
                qual = "Very High (can cause performance issues)"
            }  else if(val <= 40) {
                qual = "Extreemly High (can cause performance issues)"
            }
            this.easingFunctionQuality.attr('data-tooltip', `Quality: ${qual}`)
            this.generateEasingFunction()
        })

        this.easingIn = true
        this.easingOut = true

        this.createEasingType(dom.find('.easing-function-in'), () => this.easingIn = !this.easingIn)
        this.createEasingType(dom.find('.easing-function-out'), () => this.easingOut = !this.easingOut)
    }

    /**
     * Called when the animation tab is switched to
     */
    onSwitchedTo() {
        this.redrawProgressionCanvas()
    }

    /**
     * Creates the easing type links
     * @param {*} dom The easing dom
     * @param {*} toggle the toggle callback
     */
    createEasingType(dom, toggle) {
        let iconParent = dom.find('.easing-icon')

        dom.click(() => {
            toggle()
            this.generateEasingFunction()
            iconParent.children().toggleClass("fa-check-square").toggleClass("fa-square")
        })
    }

    /**
     * Called when a keyframe select change happenes
     */
    keyframeSelectChange() {
        this.dropdownText.text("None")
        this.easingRequiresChoice = true
        this.redrawProgressionCanvas()
    }

    /**
     * Call when a mouse event happens on the canvas.
     * @param {string} type the type of event. 'mousedown', 'mouseup' 'mousemove'
     * @param {number} mouseX the mouse x position
     * @param {number} mouseY the mouse y position
     * @param {number} buttons the buttons down
     * @param {function} misscallback the callback for if nothing was under the mouse.
     */
    mouseOverCanvas(type, mouseX, mouseY, buttons, misscallback) {
        let handler = this.pth.animationTabs.active
        if(handler === null || handler.selectedKeyFrame === undefined) {
            return
        }
        let points = handler.selectedKeyFrame.progressionPoints

        let width = this.progressionCanvas.width
        let height = this.progressionCanvas.height

        if(type === 'mousedown') {
            //If the mouse is down, find the points by finding a point withing 3*radius of the point.
            if((buttons & 1) === 1) {
                let clickedOn = points.find(p => Math.pow(width*p.x-mouseX, 2) + Math.pow(height*p.y-mouseY, 2) <= 3*radius*radius) //The 3 is to make it easier to select

                //If a point is clicked on, set the startX and startY varibles and set selectedPoint
                //Otherwise, create a new point and select it.
                if(clickedOn !== undefined) {
                    clickedOn.startX = clickedOn.x
                    clickedOn.startY = clickedOn.y
                    this.selectedPoint = clickedOn
                } else {
                    let newPoint = { x: mouseX / width, y: mouseY / height }
                    points.push( newPoint )
                    handler.selectedKeyFrame.resortPointsDirty()
                    this.selectedPoint = newPoint
                }
                this.redrawProgressionCanvas()
            }
        } else if(type === 'mousemove') {
            //If the mouse is down, and a point is selected, move the point. Else call the miss callback
            if((buttons & 1) === 1 && this.selectedPoint !== null) {
                if(!this.selectedPoint.required) {
                    this.selectedPoint.x = mouseX / width
                }
                this.selectedPoint.y = mouseY / height
                this.redrawProgressionCanvas()
                handler.selectedKeyFrame.resortPointsDirty()
            } else if((buttons & 2) === 2) {
                misscallback()
            }
        } else if(this.selectedPoint !== null) {
            //When the mouse is released, if the point hasn't moved much from the startX/Y then remove the point
            if(this.selectedPoint.startX !== undefined && this.selectedPoint.startY !== undefined && !this.selectedPoint.required) {
                let distX = width*(this.selectedPoint.startX - this.selectedPoint.x)
                let distY = height*(this.selectedPoint.startY - this.selectedPoint.y)
                if(distX*distX + distY*distY < radius*radius*3) {
                    handler.selectedKeyFrame.progressionPoints = handler.selectedKeyFrame.progressionPoints.filter(p => p !== this.selectedPoint)
                    handler.selectedKeyFrame.resortPointsDirty()
                }
            }
            this.selectedPoint = null
            this.redrawProgressionCanvas()
        }
    }

    /**
     * Redraw the canvas. Called whenever the canvas need re-rendering
     */
    redrawProgressionCanvas() {
        let width = this.progressionCanvas.width
        let height = this.progressionCanvas.height

        //Set the background style
        this.canvasCtx.fillStyle = "hsl(0, 0%, 10%)";
        this.canvasCtx.fillRect(0, 0, width, height);

        let handler = this.pth.animationTabs.active
        if(handler === null) {
            return
        }
        
        this.canvasCtx.clearRect(0, 0, width, height);

        if(handler.selectedKeyFrame !== undefined) {
            this.canvasTransformControls.applyTransforms()

            //Draw the main box background stuff.
            this.canvasCtx.fillStyle = "hsl(0, 0%, 10%)";
            this.canvasCtx.fillRect(0, 0, width, height);
            
            //Set the line stroke color
            this.canvasCtx.strokeStyle = "hsl(204, 86%, 53%)";

            //Create the box
            this.canvasCtx.beginPath();
            this.canvasCtx.rect(0, 0, width, height)
            this.canvasCtx.stroke();

            let points = handler.selectedKeyFrame.progressionPoints
        
            //Go from every point drawing the circle and the lines between them
            for(let i = 0; i < points.length; i++) {
                let point = points[i]
                let next = points[i+1]
        
                this.canvasCtx.beginPath();
                this.canvasCtx.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
        
                if(next !== undefined) {
                    this.canvasCtx.moveTo(point.x * width, point.y * height);
                    this.canvasCtx.lineTo(next.x * width, next.y * height);
                }
        
                this.canvasCtx.stroke();
            }
            
            this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    /**
     * Generate the easing points.
     */
    generateEasingFunction() {
        let handler = this.pth.animationTabs.active
        let points = Math.min(50, 10 + parseInt(this.easingFunctionQuality.val()))


        if(handler === null || handler.selectedKeyFrame === undefined || points <= 5 || this.easingRequiresChoice) {
            return
        }

        //Gets the raw function
        let funcRaw
        switch(this.easingFunction.value) {
            case "sine":
                funcRaw = x => 1 - Math.cos((x * Math.PI) / 2)
                break
            
            case "quad":
                funcRaw = x => x*x
                break
            
            case "cubic":
                funcRaw = x => x*x*x
                break
                
            case "quart":
                funcRaw = x => x*x*x*x
                break
            
            case "quint":
                funcRaw = x => x*x*x*x*x
                break
            
            case "expo":
                funcRaw = x => Math.pow(2, 10*x - 10)
                break
            
            case "circ":
                funcRaw = x => 1 - Math.sqrt(1 - Math.pow(x, 2))
                break

            case "back":
                funcRaw = x => 2.70158*x*x*x - 1.70158*x*x
                break
            
            case "elastic":
                funcRaw = x => -Math.pow(2, 10*x-10) * Math.sin((x*10-10.75)*(2*Math.PI)/3)
                break
            
            case "bounce":
                funcRaw = xIn => {
                    let x = 1 - xIn
                    
                    const n1 = 7.5625;
                    const d1 = 2.75;

                    let res
                    if (x < 1 / d1) {
                        res = n1 * x * x;
                    } else if (x < 2 / d1) {
                        res = n1 * (x -= 1.5 / d1) * x + 0.75;
                    } else if (x < 2.5 / d1) {
                        res = n1 * (x -= 2.25 / d1) * x + 0.9375;
                    } else {
                        res = n1 * (x -= 2.625 / d1) * x + 0.984375;
                    }
                    return 1 - res
                }
                break
        }

        //Gets the function with the in/out applied.
        let func
        if(this.easingIn === true) {
            if(this.easingOut === true) {
                //inout
                func = x => x < 0.5 ? funcRaw(2*x)/2 : 1 - funcRaw(2-2*x)/2
            } else {
                //in
                func = x => funcRaw(x)
            }
        } else {
            if(this.easingOut === true) {
                //out
                func = x => 1 - funcRaw(1 - x)
            } else {
                //none (linear)
                func = x => x
            }
        }
   
        //This code is very weird and should probally be rewritten.
        //The idea for this was to be able to go up the function linerally.
        //ie step along the function evenly spaced, rather than evenly spaced on the x axis.
        //To do this, I create an array of `resolution` elements ranging from 0 to 1 of the function.
        const resolution = 1000
        const step = 1 / resolution
        let array = new Array(resolution + 1)
        for(let i = 0; i < array.length; i++) {
            array[i] = func(i / resolution)
        }

        //I then get the distance from the current to the next element
        let distances = array.map((y, i) => {
            let next = array[i + 1]
            if(next === undefined) {
                return 0
            }
            let dy = next - y
            return Math.sqrt(dy*dy + step*step)
        })

        //To get the xValues, I first get the total length of the function, and divide that length
        //by the amount of points i need to generate. This gives me the amount of "distance" to move
        //per point. Then I iterate over all the points and iterate over the disatances till I find a 
        //point that goes over that distance to move for that point.
        let xValues = []
        let length = distances.reduce((a, b) => a + b)
        let xStep = length / (points - 1)
        for(let i = 0; i < points; i++) {
            let distToMove = (i+1)*xStep

            for(let d = 0; d < distances.length; d++) {
                let dist = distances[d]
                if(distToMove < dist) {
                    let val = (d + dist/distToMove)*step
                    if(val < 1) {
                        xValues.push(val)
                    }
                    break
                } else {
                    distToMove -= dist
                }
            }
        }
        
        //Get a list of the required progression points 
        //for every xvalue, push a new point to that list
        //set the progression point list to that list sorted by x value
        let progressionPoints = handler.selectedKeyFrame.progressionPoints.filter(p => p.required)
        xValues.forEach(x => progressionPoints.push({ x, y: 1 - func(x) }))
        handler.selectedKeyFrame.progressionPoints = progressionPoints.sort((p1, p2) => p1.x - p2.x)
        this.redrawProgressionCanvas()

    }
    
}