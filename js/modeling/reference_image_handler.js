import { readFile } from "../displays.js"
import { raytraceUnderMouse } from "../raytracer.js"
import { DoubleSide, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry, Texture } from "../three.js"
import { fileUploadBox, LinkedSelectableList } from "../util.js"

const startSize = 2

export class ReferenceImageHandler {
    constructor(studio, dom) {
        this.pth = studio.pth
        this.display = studio.display

        this.addedHooks = false

        this.transformControls = studio.display.createTransformControls()
        studio.group.add(this.transformControls)

        new LinkedSelectableList(dom.find('.ref-image-control-tool'), true, 'is-info').onchange(e => this.transformControls.mode = e.value)

        this.selectedTranslucency = dom.find('.refimg-translucentcy-input').on('input', e => this.transformControls.object._ref.setOpacity(e.target.value))

        this.needObj = dom.find('.object-no-object-selected, .object-no-imgref')
        this.refOnly = dom.find('.object-imgref-only')

        this.transformsInAction = false
        this.transformControls.addEventListener('mouseDown', () => this.transformsInAction = true)
        this.transformControls.addEventListener('mouseUp', () => this.transformsInAction = false)
        studio.raytracer.addEventListener('clicked', e => this.mouseDown(e))
    }

    get images() {
        return this.pth.referenceImages
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

        if(results.length !== 0) {
            this.transformControls.attach(results[0].object)
            this.needObj.toggleClass('imgref-selected', true)
            this.refOnly.css('display', '')
            this.selectedTranslucency.val(results[0].object._ref.opacity)
            e.ignore = true
            return
        } else if(this.transformControls.object) {
            this.transformControls.detach()
            this.needObj.toggleClass('imgref-selected', false)
            e.ignore = true
        }
    }

    addImage(img, name) {
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
            opacity: 100,
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
        dom.find('.name-conatiner').text(name)
        let transSlider = dom.find('.translucentcy-input')
        transSlider.on('input', e => data.setOpacity(e.target.value))
        dom.find('.delete-image').click(() => {
            this.images.splice(this.images.indexOf(data))
            dom.remove()
            texture.dispose()
            this.pth.displayGroup.remove(mesh)
            if(this.transformControls.object === mesh) {
                this.transformControls.detach()
                this.needObj.toggleClass('imgref-selected', false)
                this.refOnly.css('display', 'none')

            }
        })
 
        mesh._ref = data
        this.images.push(data)
    }

    uploadFile(file) {
        let img = document.createElement("img")
        new Promise(async(resolve) => {
            img.src = await readFile(file, (reader, f) => reader.readAsDataURL(f))
            img.onload = () => {
                let name = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name.length
                resolve({ name, img })
                img.onload = null
            }
        })
        .then(data => this.addImage(data.img, data.name))
    }

    openRefImgModal() {
        this.ensureModalCreated().then(() => {
            this.listEntry.children().detach()
            this.images.forEach(data => this. listEntry.append(data.dom))
        })
    }

    ensureModalCreated() {
        return openModal("modeler/reference_image").then(m => {
            if(this.addedHooks === true) {
                return m
            }
            this.addedHooks = true
    
            this.emptyEntry = m.find('.empty-entry')
            this.listEntry = m.find('.reference-image-list')
            
            let callback = files => [...files].forEach(file => this.uploadFile(file))
    
            m.find('#ref-img-file-input').on('input', e => callback(e.target.files))
            fileUploadBox(m.find('.modal-content'), callback)
        })
    }
}