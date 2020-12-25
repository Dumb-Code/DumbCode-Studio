import { readFile } from "../displays.js"
import { raytraceUnderMouse } from "../raytracer.js"
import { DoubleSide, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry, Texture } from "../three.js"
import { fileUploadBox, LinkedElement, LinkedSelectableList } from "../util.js"

const startSize = 2

export class ReferenceImageHandler {
    constructor(studio, dom) {
        this.pth = studio.pth
        this.studioPanels = studio.studioPanels
        this.raytracer = studio.raytracer
        this.display = studio.display

        this.addedHooks = false

        this.transformControls = studio.display.createTransformControls()
        this.transformControls.addEventListener('objectChange', () => this.updatePanelValues())
        this.transformControls.space = "world"
        studio.group.add(this.transformControls)

        new LinkedSelectableList(dom.find('.ref-image-control-tool'), true, 'is-info').onchange(e => this.transformControls.mode = e.value)
        new LinkedSelectableList(dom.find('.refimg-object-space-tool'), true, 'is-info').onchange(e => this.transformControls.space = e.value)

        this.positionElemenet = new LinkedElement(dom.find('.input-refimg-position .input-part')).onchange(e => this.transformControls.object.position.set(e.value[0], e.value[1], e.value[2]))
        this.scaleElemenet = new LinkedElement(dom.find('.input-refimg-scale'), false).onchange(() => this.updateScale())
        this.rotationElement = new LinkedElement(dom.find('.input-refimg-rotation .input-part')).withsliders(dom.find('.input-refimg-rotation .input-part-slider')).onchange(e => this.transformControls.object.rotation.set(e.value[0]*Math.PI/180, e.value[1]*Math.PI/180, e.value[2]*Math.PI/180))

        this.flipX = new LinkedElement(dom.find('.refimg-flip-x'), false, false, true).onchange(() => this.updateScale())
        this.flipY = new LinkedElement(dom.find('.refimg-flip-y'), false, false, true).onchange(() => this.updateScale())

        this.selectedTranslucency = dom.find('.refimg-translucentcy-input').on('input', e => this.transformControls.object._ref.setOpacity(e.target.value))

        this.needObj = dom.find('.object-no-object-selected, .object-no-imgref')
        this.refOnly = dom.find('.object-imgref-only')

        this.transformsInAction = false
        this.transformControls.addEventListener('mouseDown', () => this.transformsInAction = true)
        this.transformControls.addEventListener('mouseUp', () => this.transformsInAction = false)
        this.raytracer.addEventListener('clicked', e => this.mouseDown(e))
    }

    get images() {
        return this.pth.referenceImages
    }

    updateScale() {
        let value = this.scaleElemenet.value
        this.transformControls.object.scale.set(this.flipX.value?-value:value, this.flipY.value?-value:value, value)
    }

    mouseDown(e) {
        if(this.transformsInAction === true) {
            return
        }
        if(!this.pth.anySelected()) {
            this.refOnly.css('display', 'none')
            return
        }
        let results = raytraceUnderMouse(this.display.camera, this.images.map(i => i.mesh), false)
        
        if(results.length !== 0 && results[0].distance < this.raytracer.intersectedDistance && results[0].object._ref.canSelect) {
            let mesh = results[0].object
            this.transformControls.attach(mesh)
            this.needObj.toggleClass('imgref-selected', true)
            this.refOnly.css('display', '')
            this.studioPanels.useUpPanel()
            this.selectedTranslucency.val(mesh._ref.opacity)
            this.updatePanelValues()
            e.ignore = true
            return
        } else if(this.transformControls.object) {
            this.unselectPanel()
            e.ignore = true
        }
        this.refOnly.css('display', 'none')
    }

    async addImage(img, name) {
        await this.ensureModalCreated()
        let texture = new Texture(img)
        texture.needsUpdate = true
        texture.flipY = true
        texture.magFilter = NearestFilter
        texture.minFilter = NearestFilter

        let aspect = img.naturalWidth / img.naturalHeight
        let width = aspect > 1 ? startSize : startSize * aspect
        let height = aspect > 1 ? startSize / aspect : startSize

        let mat = new MeshBasicMaterial({ map:texture, side: DoubleSide, transparent : true })
        let geometry = new PlaneGeometry(width, height)

        let mesh = new Mesh(geometry, mat)
        this.pth.displayGroup.add(mesh)
        
        let dom = this.emptyEntry.clone()
        dom.removeClass('empty-entry')
        this.listEntry.append(dom)

        let data = { 
            dom,
            mesh,
            name,
            img,
            opacity: 100,
            canSelect: true,
            setOpacity: (op = data.opacity) => {
                data.opacity = op
                transSlider.val(op)
                mat.opacity = op/100

                if(this.transformControls.object?._ref == data) {
                    this.selectedTranslucency.val(op)
                }
            }
        }
        dom.find('.preview-window').append(img)
        dom.find('.name-container').text(name)
        dom.find('.refimg-is-selectable').on('input', e => data.canSelect = e.target.checked)
        let transSlider = dom.find('.translucentcy-input')
        transSlider.on('input', e => data.setOpacity(e.target.value))
        dom.find('.delete-image').click(() => {
            this.images.splice(this.images.indexOf(data))
            dom.remove()
            texture.dispose()
            this.pth.displayGroup.remove(mesh)
            if(this.transformControls.object === mesh) {
                this.unselectPanel()
            }
        })
 
        mesh._ref = data
        this.images.push(data)

        return data
    }

    updatePanelValues() {
        let mesh = this.transformControls.object
        if(mesh !== undefined) {
            this.positionElemenet.setInternalValue(mesh.position.toArray())
            this.rotationElement.setInternalValue(mesh.rotation.toArray().map(e => e * 180/Math.PI))

            this.scaleElemenet.setInternalValue(mesh.scale.z)
            this.flipX.value = mesh.scale.x !== mesh.scale.z
            this.flipY.value = mesh.scale.y !== mesh.scale.z

        }
    }

    unselectPanel() {
        this.transformControls.detach()
        this.studioPanels.discardRightPanel()
        this.needObj.toggleClass('imgref-selected', false)
    }

    uploadFile(file) {
        let img = document.createElement("img")
        readFile(file, (reader, f) => reader.readAsDataURL(f))
        .then(url => {
            img.src = url
            img.onload = () => {
                let name = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name.length
                this.addImage(img, name)
                img.onload = null
            }
        })
    }

    openRefImgModal() {
        this.ensureModalCreated().then(() => {
            openModal("modeler/reference_image")
            this.listEntry.children().detach()
            this.images.forEach(data => this. listEntry.append(data.dom))
        })
    }

    ensureModalCreated() {
        return getModal("modeler/reference_image").then(m => {
            if(this.addedHooks === true) {
                return m
            }
            let dom = $(m)
            this.addedHooks = true
    
            this.emptyEntry = dom.find('.empty-entry')
            this.listEntry = dom.find('.reference-image-list')
            
            let callback = files => [...files].forEach(file => this.uploadFile(file))
    
            dom.find('#ref-img-file-input').on('input', e => callback(e.target.files))
            fileUploadBox(dom.find('.modal-content'), callback)
        })
    }
}