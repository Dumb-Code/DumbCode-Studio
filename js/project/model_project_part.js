import { ByteBuffer } from "../animations.js"
import { readFile } from "../displays.js"
import { DCALoader } from "../formats/animation/dca_loader.js"
import { DCMLoader } from "../formats/model/dcm_loader.js"
import { DCMModel } from "../formats/model/dcm_model.js"
import { DcProject } from "../formats/project/dc_project.js"
import { DcProjectZipConverter } from "../formats/project/dc_project_zip_converter.js"
import { RemoteProject } from "../formats/project/remote_project.js"
import { FlatShading } from "../libs/three.js"
import { doubleClickToEdit, downloadBlob, fileUploadBox, getAndDeleteFiles } from "../util/element_functions.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"
import { RemoteProjectHandler } from "./remote_project_handler.js"

/**
 * The modeling part for the animation page.
 */
export class ModelProjectPart {
    constructor(dom, pth, modellingGetter, texturePart, animationPart) {
        this.pth = pth
        this.modellingGetter = modellingGetter
        this.texturePart = texturePart
        this.animationPart = animationPart
        this.emptyModelEntry = dom.find('.model-list-entry.empty-column')

        //The converter for dproj
        this.zipHandler = new DcProjectZipConverter(pth, this, texturePart, animationPart)

        //Project selected list
        this.projectSelectList = new LinkedSelectableList(null, true).onchange(v => pth.selectIndex(parseInt(v.value)))
        this.remoteProjects = new RemoteProjectHandler(pth, this, texturePart, animationPart)

        //Add pth hooks
        pth.addEventListener('newproject', e => this.initiateEntry(e.project))
        pth.addEventListener('deleteproject', e => this.projectSelectList.remove(e.project._element))
        pth.addEventListener('selectchange', e => this.projectSelectList.setValue(e.to, true))

        dom.find('.new-model-button').click(() => pth.createNewProject())

        dom.find('#model-file-input').on('input', e => this.loadModelFiles(getAndDeleteFiles(e)))
        fileUploadBox(dom.find('.model-drop-area'), files => this.loadModelFiles(files))

        dom.find('#project-file-input').on('input', e => this.loadProjectFiles(getAndDeleteFiles(e)))


    }
    
    /**
     * Upload model files
     * @param {*} files the files to upload
     */
    async loadModelFiles(files) {
        [...files].forEach(file => DCMLoader.loadModel(readFile(file), file.name, this.texturePart).then(model => this.pth.createNewProject(model)))
    }

    /**
     * Upload project files. (.dcproj)
     * @param {*} files the files to upload
     */
    async loadProjectFiles(files) {
        [...files].forEach(file => this.zipHandler.readFile(file))
    }

    /**
     * Adds a new reference image.
     * @param {*} img the img tag
     * @param {string} name the name of the reference image
     */
    addReferenceImage(img, name) {
        return this.modellingGetter().referenceImageHandler.addImage(img, name)
    }

    /**
     * Initiates the project dom entries.
     * @param {*} project 
     */
    initiateEntry(project) {
        let model = project.model

        let cloned = this.emptyModelEntry.clone()
        project._element = cloned
        cloned
            .attr('select-list-entry', project.id)
            .removeClass('empty-column')
            .insertBefore(this.emptyModelEntry)    
        cloned.find('.close-model-button').click(e => {
            this.pth.deleteProject(project)
            if(this.pth.allTabs.length == 0) {
                project.textureManager.removeAll()
                project.animationTabHandler.removeAll()
                this.animationPart.refreshAnimationList()
            }
            cloned.remove()
            this.pth.allTabs.forEach(tab => tab._element.attr('select-list-entry', tab.id))
            
            e.stopPropagation()
        })
        cloned.find('.download-model-file').click(e => {
            DCMLoader.writeModel(model).downloadAsFile(model.fileName + ".dcm")
            e.stopPropagation()
        })
        cloned.find('.download-project-file').click(e => {
            e.stopPropagation()
            this.zipHandler.writeFile(project)
            .then(content => downloadBlob(model.fileName + ".dcproj", content))
        })

        this.projectSelectList.addElement(cloned)

        doubleClickToEdit(cloned.find('.model-name-container'), name => model.fileName = name, model.fileName)
    }
}