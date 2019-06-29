class AnimationHandler {

    //animationMap
    //poses

    constructor(animationMap) {
        this.animationMap = animationMap
        this.poses = []
    }
    doAnim() {

        console.log("anim called")
    }

    onAnimationFileChange(files) {
        this.poses = []
        for (var i = 0; i < files.length; i++) {
            var file = files.item(i)
            if(file.name.endsWith(".tbl")) {
                const reader = new FileReader()
                reader.onload = e => {
                    TBLModel.loadModel(e.target.result, model => this.poses.push( model ))
                }
                reader.readAsBinaryString(file)
            }
        }
    }

    //Deprecated. This is just to test models
    setPoseIndex(index) {
        var pose = this.poses[index % this.poses.length]

        pose.allCubes.forEach(cube => {
            var entry = this.animationMap.get(cube.name)
            if(entry) {
                 entry.position.set(cube.rotationPoint[0], cube.rotationPoint[1], cube.rotationPoint[2])
                 entry.rotation.set(cube.rotation[0] * Math.PI / 180, cube.rotation[1] * Math.PI / 180, cube.rotation[2] * Math.PI / 180)
            }
        })

    }
}


