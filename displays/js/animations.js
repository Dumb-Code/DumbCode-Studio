class AnimationHandler {

    //inertia
    //animationMap
    //increments

    //compoundTime

    //poseIndex
    //currentIncrement
    //previousIncrement


    constructor(animationMap) {
        this.inertia = false

        this.animationMap = animationMap
        this.increments = []
        this.compoundTime = 0
        this.poseIndex = 0
    }

    /**
     * 
     * @param {FileList} files 
     */
    onAnimationFileChange(files) {
        var tblFiles = []
        var infoFile

        for (var i = 0; i < files.length; i++) {
            var file = files.item(i)
            if(file.name.endsWith(".tbl")) {
                tblFiles.push(file)
            }
            if(file.name == "animation.json") {
                infoFile = file
            }
        }

        //todo: our own alert system
        if(!infoFile) {
            alert("Need an animation.json file") //todo: maybe just infer the animation  timeings?
            return
        }
        if(files.length == 0) {
            alert("No poses uploaded")
            return
        }

        //reset this objects stuff
        this.increments = []
        this.currentIncrement = null
        this.previousIncrement = null
        this.poseIndex = 0
        this.compoundTime = 0


        const readFile = file => {
            return new Promise((resolve, reject) => {
                reader.onload = event => resolve(event.target.result)
                reader.onerror = error => reject(error)
                reader.readAsText(file)
              })
        }

        var posesMap = new Map()
        const loadFiles = async() => {
            for (const file of tblFiles) {
                let data = await readFile(file)
                let model = await TBLModel.loadModel(data)

                posesMap.set(file.name, model)
            }
        }


        loadFiles()


        var info
        var fileReader = new FileReader()
        fileReader.onload = e => {
            info = JSON.parse(e.target.result)
        }
        fileReader.readAsBinaryString(infoFile)

        setTimeout(() => {

            while(!info && posesMap.size != files.length) {
                //wait
            }

            var baseTime = info.base_time / 20 //from ticks to seconds todo: overrides

            var poses = Array.from(posesMap.entries())
            poses.sort()

            poses.forEach(entry => {
                this.increments.push( new ModelIncrement(entry[1].cubeMap, baseTime) )
            })

            console.log("Animations Uploaded")

            this.currentIncrement = this.increments[0]
            this.incrementPose()

        }, 0)
    }


    animate(deltaTime) {
        if(!this.currentIncrement) {
            return
        }
        this.compoundTime += deltaTime
        var percentageDone = this.compoundTime / this.currentIncrement.time
        if(percentageDone > 1) {
            this.incrementPose()
            percentageDone = 0
        }

        if(this.inertia) {
            percentageDone = Math.sin(Math.PI * (percentageDone - 0.5)) * 0.5 + 0.5
        }

        for(var [name, entry] of animationMap.entries()) {

            var rotation = this.interpolate(this.previousIncrement.rotationMap.get(name), this.currentIncrement.rotationMap.get(name), percentageDone)
            entry.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)

            var rotationPoint = this.interpolate(this.previousIncrement.rotationPointMap.get(name), this.currentIncrement.rotationPointMap.get(name), percentageDone)
            entry.position.set(rotationPoint[0], rotationPoint[1], rotationPoint[2])

        }
    }

    interpolate(prev, next, alpha) {
        var out = new Array(3)

        out[0] = prev[0] + (next[0] - prev[0]) * alpha
        out[1] = prev[1] + (next[1] - prev[1]) * alpha
        out[2] = prev[2] + (next[2] - prev[2]) * alpha

        return out
    }

    incrementPose() {
        this.compoundTime = 0

        this.poseIndex += 1
        if(this.poseIndex >= this.increments.length) {
            this.poseIndex = 0
        }

        this.previousIncrement = this.currentIncrement
        this.currentIncrement = this.increments[this.poseIndex]

    }


    toggleInertia() {
        this.inertia = !this.inertia;
    }


}

class ModelIncrement {

    //time
    //rotationMap
    //rotationPointMap

    constructor(poseMap, time) {

        this.time = time
        this.rotationMap = new Map()
        this.rotationPointMap = new Map()

        for(var [name, cube] of poseMap.entries()) {
            this.rotationMap.set( name, cube.rotation )
            this.rotationPointMap.set( name, cube.rotationPoint )
        }
    }

    //add up delta time calls, then just do simple interpolation

}

