import { readFile } from "../displays.js"
import { raytraceUnderMouse } from "../raytracer.js"
import { DoubleSide, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry, Texture } from "../libs/three.js"
import { fileUploadBox, getAndDeleteFiles } from "../util/element_functions.js"
import { LinkedElement } from "../util/linked_element.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"

const startSize = 2

/**
 * Used to handle the reference images 
 */
export class ReferenceImageHandler {
    constructor(studio, dom) {
        this.pth = studio.pth
        this.studioPanels = studio.studioPanels
        this.raytracer = studio.raytracer
        this.display = studio.display

        this.addedHooks = false

        //Create the transform controls
        this.transformControls = studio.display.createTransformControls()
        this.transformControls.addEventListener('objectChange', () => this.updatePanelValues())
        this.transformControls.space = "world"
        studio.group.add(this.transformControls)

        //Bind the righthand side elements
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

        //Bind transformInAction 
        this.transformsInAction = false
        this.transformControls.addEventListener('mouseDown', () => this.transformsInAction = true)
        this.transformControls.addEventListener('mouseUp', () => this.transformsInAction = false)
        
        //On the raytracer clicked.
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
        //If the transform controls are in action then ignore
        if(this.transformsInAction === true) {
            return
        }
        //If there isn't anything selected, disable.
        if(!this.pth.anySelected()) {
            this.refOnly.css('display', 'none')
            return
        }
        //Get the raytrace results
        let results = raytraceUnderMouse(this.display.camera, this.images.map(i => i.mesh), false)
        
        //If there is a intersected element, that's closer than the raytracerer cube distance
        if(results.length !== 0 && results[0].distance < this.raytracer.intersectedDistance && results[0].object._ref.canSelect) {
            //Enable the transform tools, and enable the whole right handside panel
            let mesh = results[0].object
            this.transformControls.attach(mesh)
            this.needObj.toggleClass('imgref-selected', true)
            this.refOnly.css('display', '')
            this.studioPanels.useUpPanel() //Make sure the righthand side has width.
            this.selectedTranslucency.val(mesh._ref.opacity)
            this.updatePanelValues()
            e.ignore = true
            return
        } else if(this.transformControls.object) { //Is active, we need to disable.
            this.unselectPanel()
            e.ignore = true
        }
        this.refOnly.css('display', 'none')
    }

    /**
     * Adds an image element to the reference images.
     * @param {*} img the img tag 
     * @param {string} name the name
     */
    async addImage(img, name) {
        //Ensure the modal is created.
        await this.ensureModalCreated()
        let texture = new Texture(img)
        texture.needsUpdate = true
        texture.flipY = true
        texture.magFilter = NearestFilter
        texture.minFilter = NearestFilter

        //Get an element with maximum width/height of startSize
        let aspect = img.naturalWidth / img.naturalHeight
        let width = aspect > 1 ? startSize : startSize * aspect
        let height = aspect > 1 ? startSize / aspect : startSize

        //Create the mesh
        let mat = new MeshBasicMaterial({ map:texture, side: DoubleSide, transparent : true })
        let geometry = new PlaneGeometry(width, height)
        let mesh = new Mesh(geometry, mat)
        this.pth.displayGroup.add(mesh)
        
        //Attach the dom elements
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

    /**
     * Updates the right hand side panel values
     */
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

    /**
     * Deselects the reference image. 
     */
    unselectPanel() {
        this.transformControls.detach()
        this.studioPanels.discardRightPanel()
        this.needObj.toggleClass('imgref-selected', false)
    }

    /**
     * Parses and adds the file as a reference image.
     * @param {file} file the file to upload 
     */
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

    /**
     * Opens the reference image modal.
     */
    openRefImgModal() {
        this.ensureModalCreated().then(() => {
            openModal("modeler/reference_image")
            this.listEntry.children().detach()
            this.images.forEach(data => this. listEntry.append(data.dom))
        })
    }

    /**
     * Ensure the modal is created.
     */
    ensureModalCreated() {
        return getModal("modeler/reference_image").then(m => {
            //If the hooks aren't applied, apply them.
            if(this.addedHooks === true) {
                return m
            }
            let dom = $(m)
            this.addedHooks = true
    
            this.emptyEntry = dom.find('.empty-entry')
            this.listEntry = dom.find('.reference-image-list')
            
            let callback = files => [...files].forEach(file => this.uploadFile(file))
    
            dom.find('#ref-img-file-input').on('input', e => callback(getAndDeleteFiles(e)))
            fileUploadBox(dom.find('.modal-content'), callback)
        })
    }
}