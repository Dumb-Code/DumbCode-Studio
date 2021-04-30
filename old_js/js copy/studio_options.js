import { doubleClickToEdit } from "./util/element_functions.js";
import { PerspectiveCamera, OrthographicCamera, Texture, CanvasTexture, TubeBufferGeometry } from "./libs/three.js";
import { LinkedSelectableList } from "./util/linked_selectable_list.js";

/**
 * Class used to control the studio options. These are the bottom parts
 */
export class StudioOptions {

    constructor(dom, raytracer, pth, display, setCamera, renameCube) {
        this.raytracer = raytracer
        this.pth = pth

        //The texture mode 
        let textureModeConatiner = dom.find('.texture-mode-label')
        this.textureMode = new LinkedSelectableList(dom.find('.select-texture-mode')).onchange(e => {
            switch(e.value) {
                case "textured":
                    pth.updateTexture(m => {
                        m._mode = 0
                        m.map = m._mapCache
                        m.wireframe = false
                    })
                    break
                
                case "untextured":
                    pth.updateTexture(m => {
                        m._mode = 1
                        m.map = null
                        m.wireframe = false
                    })
                    break
                
                case "outline":
                    pth.updateTexture(m => {
                        m._mode = 2
                        m.map = null
                        m.wireframe = true
                    })
                    break
            }
            textureModeConatiner.text(e.value.charAt(0).toUpperCase() + e.value.slice(1))
        })


        //The camera mode
        let cameraModeConatiner = dom.find('.camera-mode-label')
        let canvasContainer = dom.find('.display-div')
        this.perspectiveFov = dom.find('.perspective-camera-fov')
        this.cameraMode = new LinkedSelectableList(dom.find('.select-camera-mode')).onchange(e => {
            let foundCanvas = canvasContainer.filter('.is-active').get(0)
            let foundPerspective = this.perspectiveFov.filter('.is-active')
            let cam
            switch(e.value) {
                case "perspective":
                    cam = new PerspectiveCamera(foundPerspective.val(), foundCanvas.clientWidth / foundCanvas.clientHeight, 0.1, 700)           
                    cam.zoom = display.camera.zoom / (display.camera.isOrthographicCamera ? 100 : 1)
                    cam.updateProjectionMatrix()
                    break;
                case "orthographic":
                    cam = new OrthographicCamera(foundCanvas.clientWidth / -2, foundCanvas.clientWidth / 2, foundCanvas.clientHeight / 2, foundCanvas.clientHeight / -2, 0.1, 700)
                    cam.zoom = display.camera.zoom * (display.camera.isPerspectiveCamera ? 100 : 1)
                    cam.updateProjectionMatrix()
                    break
            }

            cameraModeConatiner.text(e.value.charAt(0).toUpperCase() + e.value.slice(1))

            cam.position.copy(display.camera.position)
            cam.rotation.copy(display.camera.rotation)

            cam.updateProjectionMatrix()
            setCamera(cam)

        })
        this.perspectiveFov.on('input', () => {
            let cam = display.camera
            if(cam.isPerspectiveCamera) {
                cam.fov = this.perspectiveFov.val()
                cam.updateProjectionMatrix()
            }
        })

        //The toggle cube and grid buttons
        dom.find('.toggle-cube-button').click(() => display.toggleBlock())
        dom.find('.toggle-grid-button').click(() => display.toggleGrid())

        //The cube name display.
        //The cube eye and lock is so horribly done holy shit.
        this.cubeName = dom.find('.cube-name-display')
        doubleClickToEdit(this.cubeName, name => this.raytracer.oneSelected() ? renameCube(this.raytracer.firstSelected().tabulaCube, name) : 0)
        this.cubeLockEyeContainer = dom.find('.cube-lock-eye')
        this.cubeVisible = this.cubeLockEyeContainer.find('.selected-cube-visible').click(() => {
            $(".cube-line-controller.cube-selected .cube-hide-icon-container").click()
        })
        this.cubeLocked = this.cubeLockEyeContainer.find('.selected-cube-locked').click(() => {
            $(".cube-line-controller.cube-selected .cube-lock-icon-container").click()
        })

        //the total cube count. When clicked, should select all cubes, or deselect all cubes if all already selected
        this.totalCubeCount = dom.find('.total-cubes-display')
        this.totalCubeCount.click(() => {
            if(this.raytracer.selectedSet.size !== this.pth.model.cubeMap.size) {
                this.raytracer.clearEventData()
                this.pth.model.cubeMap.forEach(cube => this.raytracer.clickOnMesh(cube.cubeMesh, true, false, true))
                this.raytracer.dispatchEvents(true)
            } else {
                this.raytracer.deselectAll()
            }
        })

        //The total children cube count. WHen clicked should select all the children
        this.cubeChildrenCount = dom.find('.cube-children-display')
        this.cubeChildrenCount.click(() => {
            if(this.raytracer.oneSelected()) {
                this.raytracer.clearEventData()
                this.raytracer.firstSelected().tabulaCube.getAllChildrenCubes().forEach(cube => this.raytracer.clickOnMesh(cube.cubeMesh, true, false, true))
                this.raytracer.dispatchEvents(true)
            }
        })

        this.raytracer.addEventListener('selectchange', () => this.refreshOptionTexts())
    }

    /**
     * Refresh the option doms
     */
    refreshOptionTexts() {
        if(this.raytracer.oneSelected()) {
            let cube = this.raytracer.firstSelected().tabulaCube
            this.cubeName.css('display', '').find('.dbl-text').text(cube.name)
            this.cubeLockEyeContainer.css('display', '')

            //This code makes me want to destroy things.
            this.cubeVisible.children().children().remove()
            this.cubeVisible.children().append($(".cube-line-controller.cube-selected .cube-hide-icon-container").children().clone())
            this.cubeLocked.children().children().remove()
            this.cubeLocked.children().append($(".cube-line-controller.cube-selected .cube-lock-icon-container").children().clone())

            let size = cube.getAllChildrenCubes().length
            this.cubeChildrenCount.css('display', '').text(`${size} Child Object${size===1?"":"s"}`)
        } else {
            this.cubeName.css('display', 'none')
            this.cubeLockEyeContainer.css('display', 'none')

            if(this.raytracer.anySelected()) {
                this.cubeChildrenCount.css('display', '').text(`${this.raytracer.selectedSet.size} Total Selected`)
            } else {
                this.cubeChildrenCount.css('display', 'none')
            }
        }

        let size = this.pth.model.cubeMap.size
        this.totalCubeCount.text(`${size} Total Object${size===1?"":"s"}`)
    }

}