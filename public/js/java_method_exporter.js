
const mapclas = (pkg, name = pkg.split(".").slice(-1)[0], lowerName = name.charAt(0).toLowerCase() + name.slice(1)) => {
    return { package: pkg, name, lowerName }
}

const mcp112 = {
    //Imported classes:
    baseModel: mapclas("net.minecraft.client.model.ModelBase"),
    modelCube: mapclas("net.minecraft.client.model.ModelRenderer"),

    //Methods:
    animateModel: "setLivingAnimations",

    //Fields
    boxList: "boxList",

    cubeRotX: "rotateAngleX",
    cubeRotY: "rotateAngleY",
    cubeRotZ: "rotateAngleZ",

    entityAge: "ticksExisted"
}

let mcp113 = Object.assign(Object.assign({}, mcp112), {
    baseModel: mapclas("net.minecraft.client.renderer.entity.model.EntityModel"),
    modelCube: mapclas("net.minecraft.client.renderer.entity.model.RendererModel")
})

const yarn = {
    //Imported classes:
    baseModel: mapclas("net.minecraft.client.render.entity.model.EntityModel"),
    modelCube: mapclas("net.minecraft.client.model.Cuboid"),

    //Methods:
    animateModel: "animateModel",

    //Fields
    boxList: "cuboidList",

    cubeRotX: "pitch",
    cubeRotY: "yaw",
    cubeRotZ: "roll",

    entityAge: "age"
}

const allMappings = { mcp112, mcp113, yarn }

export class JavaMethodExporter {
    
    constructor() {
        this.mappings = "mcp112"
        this.packageInput = "myPackage"
    }

    async getText(filename) {
        let mappings = allMappings[this.mappings];

        let replacer = {
            mappings,
            inputs: {
                package: this.packageInput
            },
        }

        let rawText = await fetch(filename).then(r => r.text())
        
        let mappedText = rawText.replace(/\${([^}]*)}/g, (_r,k) => {
            let curr = replacer
            k.split(".").forEach(e => curr = curr[e])
            return curr 
        });

        return mappedText
    }

    async generateJavaMethod(tbl, animationHandler, speed) {

        let animatedModel = document.getElementById("java-method-code-animated-model")
        animatedModel.innerText = await this.getText(`method_export/animated_model.txt`)
    
        let animatedEntityEntry = document.getElementById("java-method-code-animated-entity-entry")
        animatedEntityEntry.innerText = await this.getText(`method_export/animated_entity_entry.txt`)
    
    
        let elem = document.getElementById("java-method-code-result")
        let animationName = document.getElementById("java-method-name").value
        
        let times = animationHandler.sortedTimes
        let arrEqual = (arr1, arr2) => arr1[0] == arr2[0] && arr1[1] == arr2[1] && arr1[2] == arr2[2]
        
        let decimalCutoff = Math.pow(10, 3) //the 3 represents 3 decimal places
        let getNum = num => Math.round(num * decimalCutoff) / decimalCutoff
    
        let createSnapshot = () => {
            let snapshot = []
            tbl.cubeMap.forEach((value, name) => {
                let rot = value.cubeGroup.rotation
                let pos = value.cubeGroup.position
    
                snapshot.push( { name, rotation:[rot.x, rot.y, rot.z], position:[pos.x, pos.y, pos.z] } )
            })
            return snapshot
        }
    
        tbl.resetAnimations()
        let eventMap = new Map() //<float, cubereference[]>
    
        times.forEach(eventKf => {
            times.forEach(kf => kf.animate(eventKf.startTime, true))
            eventMap.set(eventKf.startTime, createSnapshot())
    
            times.forEach(kf => kf.animate(eventKf.startTime + eventKf.duration, true))
            eventMap.set(eventKf.startTime + eventKf.duration, createSnapshot())
        });
    
        let sorted = [...eventMap.keys()].sort((a, b) => a - b)
        let totalResult = animationHandler.totalTime
    
        let result = `
    /**
     * Play the animation {@code ${animationName}}, which is ${totalResult} ticks long
     * @param entry The entry to run the animation on
     * @param ticksDone the amount of ticks that this animation has been running for. This doesn't have to start at 0
     * This method is generated from DumbCode Animation Studio v${version}
     */
    private void playAnimation${animationName.charAt(0).toUpperCase() + animationName.slice(1)}(AnimatedEntityEntry entry, float ticksDone) {
        ticksDone *= ${speed}; //Speed of the animation\n`
        if(animationHandler.looping) {
            result += `    ticksDone %= ${totalResult};  //Loop the animation\n`
        }
    
        result += `\n    int snapshotID;\n`
    
        for(let i = 0; i < sorted.length - 2; i++) {
            result += `    `
            if(i != 0) {
                result += `else `
            }
            result += `if(ticksDone < ${sorted[i + 1]}) snapshotID = ${i};\n`
        }
        result += `    else snapshotID = ${sorted.length - 2};
        entry.ensureSnapshot("${animationName}", snapshotID);
        `
    
        let previousSnapshot = false
        for(let i = 0; i < sorted.length - 1; i++) {
            let start = sorted[i]
            let end = sorted[i + 1]
    
            result += 
    `
        if (ticksDone > ${start}) {
            float percentage = (ticksDone - ${start}F) / ${end - start}F;
            if(percentage > 1F) percentage = 1F;\n`
    
            let snapshot = eventMap.get(end)
    
            let captured = new Map()
            snapshot.forEach(ss => {
                captured.set(ss.name, {rotation:ss.rotation, position:ss.position})
                let skip = false
                if(previousSnapshot) {
                    let ps = previousSnapshot.get(ss.name)
                    if(arrEqual(ps.rotation, ss.rotation) && arrEqual(ps.position, ss.position)) {
                        skip = true
                    }
                }
                if(!skip) {
                    result += `        entry.setTransforms(this.${ss.name}, ${getNum(ss.position[0])}F, ${getNum(ss.position[1])}F, ${getNum(ss.position[2])}F, ${getNum(ss.rotation[0])}F, ${getNum(ss.rotation[1])}F, ${getNum(ss.rotation[2])}F, percentage);\n`
                }
            })
            result += "    }"
            previousSnapshot = captured   
        }
    
        result += 
        `\n
    }`
        elem.innerText = result
    
    }

}