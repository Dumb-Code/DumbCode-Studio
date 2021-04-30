//Add the class to the correct elements when intersection/selection happenes
export function applyCubeStateHighlighting(dom, studio) {
    //When an intersect event happens
    studio.raytracer.addEventListener('intersection', e => {
        if(e.old !== undefined) {
            e.old.tabulaCube._elementDiv?.removeClass('cube-intersected')
        }
        if(e.cube !== undefined) {
            e.cube.tabulaCube._elementDiv?.addClass('cube-intersected')
        }
    })
    
    //When a selection change happens
    studio.raytracer.addEventListener('select', e => e.cubes.forEach(cube => cube.tabulaCube._elementDiv?.addClass('cube-selected')))
    studio.raytracer.addEventListener('deselect', e => e.cubes.forEach(cube => cube.tabulaCube._elementDiv?.removeClass('cube-selected')))
}