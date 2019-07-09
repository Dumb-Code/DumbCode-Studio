const sectionWidth = 20
const ticksPerSection = 1 
const pixelsPerTick = sectionWidth / ticksPerSection
const resolution = 10


export class KeyframeManger {

    cubeMap;      

    lables = new Map()

    keyframes;

    constructor(keyframeBoard, keyframes, cubeMap) {
        this.cubeMap = cubeMap
        this.keyframes = keyframes
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
            keyframeBoard.addEventListener("mousemove", mouseMove, false);
        }, false);
        
        document.addEventListener("mouseup", () => {
            keyframeBoard.removeEventListener("mousemove", mouseMove, false)
        }, false);

        document.addEventListener("resize", () => this.updateLables())
    }

    onFrame(deltaTime) {
        this.playstate.onFrame(deltaTime)

        for(let kflist of this.keyframes.values()) {
            kflist.forEach(kf => kf.animate(this.playstate.ticks))
        }
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
                label.style.textAlignLast = "center"
                label.style.width = sectionWidth + "px"
                label.innerHTML = res
                this.lables.set(res, label)
                this.board.appendChild(label)
            }
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