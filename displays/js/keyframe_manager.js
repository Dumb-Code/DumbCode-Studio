const sectionWidth = 20
const ticksPerSection = 1 
const pixelsPerTick = sectionWidth / ticksPerSection
const resolution = 10


export class KeyframeManger {

    keyframes = [];

    lables = new Map()

    constructor(keyframeBoard) {
        this.board = keyframeBoard

        const createContainer = (classname, parent = this.board) => {
            let div = document.createElement("div")
            div.className = classname
            parent.appendChild(div)
            return div
        }

        this.labelBoard = createContainer("keyframe-board-labels")
        this.entryBoard = createContainer("keyframe-board-entries")
        this.playbackMarker = createContainer("keyframe-playback-marker",  this.entryBoard)

        this.scroll = 0

        this.updateLables()

        let mouseMove = e => {
            this.scroll -= e.screenX - this.xHold
            this.scroll = this.scroll < 0 ? 0 : this.scroll
            this.xHold = e.screenX
            this.updateScroll()
        }
        keyframeBoard.addEventListener("mousedown", e => {
            this.xHold = e.screenX
            keyframeBoard.addEventListener("mousemove", mouseMove, false);
        }, false);
        
        document.addEventListener("mouseup", () => {
            keyframeBoard.removeEventListener("mousemove", mouseMove, false)
        }, false);

        document.addEventListener("resize", () => this.updateScroll())
    }

    updateScroll() {
        this.board.style.backgroundPositionX = -this.scroll + "px"
        this.updateLables()
        this.updateKeyframes()
    }

    setup(keyframes) {
        this.keyframes.forEach(this.board.removeChild)

        this.keyframes = keyframes
        this.updateKeyframes()
    }

    ensureFramePosition(ticks) {
        let left = this.scroll / pixelsPerTick

        let conatainerWidth = this.board.clientWidth
        let ticksInContainer = conatainerWidth / pixelsPerTick

        let xpos = 0
        //Not on screen, we need to move screen to fit
        if(ticks < left || ticks > left + ticksInContainer) {
            this.scroll = ticks * pixelsPerTick
            this.updateScroll()
        } else {
            xpos = ((ticks - left) / ticksInContainer) * this.board.clientWidth
        }

        this.playbackMarker.style.left = this.entryBoard.getBoundingClientRect().x + xpos + "px"
    }

    updateKeyframes() {
        this.keyframes.forEach(kf => {
            if(!kf.element) {

                let wrapper = document.createElement("div")
                this.entryBoard.appendChild(wrapper)
                wrapper.className = "keyframe-entry-wrapper"


                let inner = document.createElement("div")
                wrapper.appendChild(inner)
                inner.className = "keyframe-entry"

                let marker = document.createElement("div")
                inner.appendChild(marker)
                marker.className = "keyframe-entry-marker"

                marker.onmouseenter = () => {
                    wrapper.classList.toggle("is-hovered", true)
                    inner.classList.toggle("is-hovered", true)
                }

                marker.onmouseleave = () => {
                    wrapper.classList.toggle("is-hovered", false)
                    inner.classList.toggle("is-hovered", false)
                }

                kf.element = wrapper

            }
            
            let x = this.entryBoard.getBoundingClientRect().x;

            let left = kf.startTime * pixelsPerTick

            kf.element.style.width = kf.duration * pixelsPerTick + "px"
            kf.element.style.left = x + left - this.scroll + "px"
        })
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
                label.style.color = "#antiquewhite"
                label.style.textAlign = "center"
                label.style.textAlignLast = "center"
                label.style.width = sectionWidth + "px"
                label.classList.add("disable-select")
                label.innerHTML = res
                this.lables.set(res, label)
                this.labelBoard.appendChild(label)
            }
            label.style.paddingLeft = (res * pixelsPerTick) - this.scroll + "px"
            acceptedLables.push(res)
        }
        for (const label of this.lables.keys()) {
            if(!acceptedLables.includes(label)) {
                this.labelBoard.removeChild(this.lables.get(label))
                this.lables.delete(label)
            }
        } 
    }
}