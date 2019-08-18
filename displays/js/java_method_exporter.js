
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
}