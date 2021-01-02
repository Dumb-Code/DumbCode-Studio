import { DCMCube, DCMModel } from "./dcm_loader.js"

const DECODER = new TextDecoder('utf-8')
export function readBBModel(data) {
    let obj = JSON.parse(DECODER.decode(data))
    let model = new DCMModel()

    obj.elements.forEach(elem => {
        let dims = elem.to.map((e, i) => e - elem.from[i])
        let off = elem.from.map((e, i) => e - elem.origin[i])
        let inf = elem.inflate ?? 0
        let cg = dims.map(e => (e - Math.ceil(e)) / 2)
        model.children.push(new DCMCube(
            elem.name,
            dims.map(e => Math.ceil(e)),
            elem.origin,
            off.map((o, i) => o + cg[i]),
            elem.rotation ?? [0,0,0],
            [0, 0], //TODO: text offset
            false, //TODO: text offset
            [cg[0]+inf, cg[1]+inf, cg[2]+inf],
            [],
            model
        ))
    })

    return model
    
}