//Add the class to the correct elements when intersection/selection happenes
export function applyCubeStateHighlighting(dom, studio) {
    studio.raytracer.addEventListener('intersection', e => {
        if(e.old !== undefined) {
            dom.find(`[cubename='${e.old.tabulaCube.name}']`).removeClass('cube-intersected')
        }
        if(e.cube !== undefined) {
            dom.find(`[cubename='${e.cube.tabulaCube.name}']`).addClass('cube-intersected')
        }
    })
    studio.raytracer.addEventListener('select', e => e.cubes.forEach(cube => dom.find(`[cubename='${cube.tabulaCube.name}']`).addClass('cube-selected')))
    studio.raytracer.addEventListener('deselect', e => e.cubes.forEach(cube => dom.find(`[cubename='${cube.tabulaCube.name}']`).removeClass('cube-selected')))
}