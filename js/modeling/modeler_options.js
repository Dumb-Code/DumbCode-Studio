import { doubleClickToEdit, LinkedSelectableList } from "../util.js";
import { PerspectiveCamera, OrthographicCamera, Texture, CanvasTexture } from "../three.js";

export class ModelerOptions {

    constructor(dom, studio, setCamera, renameCube) {
        this.raytracer = studio.raytracer
        this.textureMode = new LinkedSelectableList(dom.find('.select-texture-mode')).onchange(e => {
            switch(e.value) {
                case "textured":
                    studio.pth.updateTexture(m => {
                        m.map = m._mapCache
                        m.wireframe = false
                    })
                    break
                
                case "untextured":
                    studio.pth.updateTexture(m => {
                        m.map = null
                        m.wireframe = false
                    })
                    break
                
                case "outline":
                    studio.pth.updateTexture(m => {
                        m.map = null
                        m.wireframe = true
                    })
                    break
            }
        })

        let canvasContainer = dom.find('.display-div').get(0)
        this.perspectiveFov = dom.find('.perspective-camera-fov')
        this.cameraMode = new LinkedSelectableList(dom.find('.select-camera-mode')).onchange(e => {
            let cam
            switch(e.value) {
                case "perspective":
                    cam = new PerspectiveCamera(this.perspectiveFov.val(), canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 700)
                    break;
                case "orthographic":
                    cam = new OrthographicCamera(canvasContainer.clientWidth / -2, canvasContainer.clientWidth / 2, canvasContainer.clientHeight / 2, canvasContainer.clientHeight / -2, 0.1, 700)
                    cam.zoom = 100
                    cam.updateProjectionMatrix()
                    break
            }

            cam.position.copy(studio.display.camera.position)
            cam.rotation.copy(studio.display.camera.rotation)   
        
            setCamera(cam)

        })
        this.perspectiveFov.on('input', () => {
            let cam = studio.display.camera
            if(cam.isPerspectiveCamera) {
                cam.fov = this.perspectiveFov.val()
                cam.updateProjectionMatrix()
            }
        })

        dom.find('.toggle-cube-button').click(() => studio.display.toggleBlock())
        dom.find('.toggle-grid-button').click(() => studio.display.toggleGrid())

        this.cubeName = dom.find('.cube-name-display')
        doubleClickToEdit(this.cubeName, name => this.raytracer.oneSelected() ? renameCube(this.raytracer.firstSelected().tabulaCube, name) : 0)
        this.cubeLockEyeContainer = dom.find('.cube-lock-eye')
        this.cubeVisible = this.cubeLockEyeContainer.find('.selected-cube-visible').click(() => {
            $(".cube-line-controller.cube-selected .cube-hide-icon-container").click()
        })
        this.cubeLocked = this.cubeLockEyeContainer.find('.selected-cube-locked').click(() => {
            $(".cube-line-controller.cube-selected .cube-lock-icon-container").click()
        })
        this.cubeChildrenCount = dom.find('.cube-children-display')

        this.cubeChildrenCount.click(() => {
            if(this.raytracer.oneSelected()) {
                this.raytracer.firstSelected().tabulaCube.getAllChildrenCubes().forEach(cube => this.raytracer.clickOnMesh(cube.cubeMesh, true, false))
            }
        })

        this.raytracer.addEventListener('selectchange', () => this.refreshOptionTexts())
    }

    refreshOptionTexts() {
        if(this.raytracer.oneSelected()) {
            let cube = this.raytracer.firstSelected().tabulaCube
            this.cubeName.css('display', '').find('.dbl-text').text(cube.name)
            this.cubeLockEyeContainer.css('display', '')

            this.cubeVisible.children().children().remove()
            this.cubeVisible.children().append($(".cube-line-controller.cube-selected .cube-hide-icon-container").children().clone())

            this.cubeLocked.children().children().remove()
            this.cubeLocked.children().append($(".cube-line-controller.cube-selected .cube-lock-icon-container").children().clone())

            this.cubeChildrenCount.css('display', '').text(`${cube.getAllChildrenCubes().length} Child Objects`)
        } else {
            this.cubeName.css('display', 'none')
            this.cubeLockEyeContainer.css('display', 'none')

            if(this.raytracer.anySelected()) {
                this.cubeChildrenCount.css('display', '').text(`${this.raytracer.selectedSet.size} Total Selected`)
            } else {
                this.cubeChildrenCount.css('display', 'none')
            }
        }
    }

}