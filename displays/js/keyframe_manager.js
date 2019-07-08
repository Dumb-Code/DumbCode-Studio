const sectionWidth = 20
const ticksPerSection = 5 
const pixelsPerTick = sectionWidth / ticksPerSection
const resolution = 40


export class KeyframeManger {

    lables = new Map()

    constructor(keyframeBoard) {
        this.board = keyframeBoard
        this.scroll = 0

        this.updateLables()
        

        let mouseMove = e => {
            this.scroll -= e.offsetX - this.xHold
            this.scroll = this.scroll < 0 ? 0 : this.scroll
            this.xHold = e.offsetX
            this.board.style.backgroundPositionX = -this.scroll + "px"
            this.updateLables()
        }
        keyframeBoard.addEventListener("mousedown", e => {
            this.xHold = e.offsetX
            console.log(this.xHold)
            keyframeBoard.addEventListener("mousemove", mouseMove, false);
        }, false);
        
        document.addEventListener("mouseup", () => {
            keyframeBoard.removeEventListener("mousemove", mouseMove, false)
        }, false);

        document.addEventListener("resize", () => this.updateLables())
    }

    updateLables() {
        let left = this.scroll / pixelsPerTick
        let right = left + (this.board.clientWidth / pixelsPerTick)

        let resolutionStart = left - (left % resolution) + resolution
        let resolutionEnd = right - (right % resolution)

        if(left % resolution == 0) {
            resolutionStart = left
        }

        let acceptedLables = []
        for(let res = resolutionStart; res <= resolutionEnd; res += resolution) {
            let label
            if(this.lables.has(res)) {
                label = this.lables.get(res)
            } else {
                label = document.createElement("label")
                label.style.position = "absolute"
                label.style.color = "#000000"
                label.style.textAlign = "center"
                label.innerHTML = res
                this.lables.set(res, label)
                this.board.appendChild(label)
            }
            console.log(this.board.clientLeft)
            label.style.paddingLeft = this.board.clientLeft + (res * pixelsPerTick) - this.scroll + "px"
            acceptedLables.push(res)
        }
        for (const label of this.lables.keys()) {
            if(!acceptedLables.includes(label)) {
                this.board.removeChild(this.lables.get(label))
                this.lables.delete(label)
            }
        }
        
    }
}

class KeyFrame {
    startTime; 
    duration;
    rotationMap;
    rotationPointMap;
    
}