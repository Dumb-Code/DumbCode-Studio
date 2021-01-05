import { ByteBuffer } from "../animations.js"
import { readFile } from "../displays.js"
import { DCALoader } from "../formats/animation/dca_loader.js"
import { DCMModel } from "../formats/model/dcm_loader.js"
import { DcProject } from "../formats/project/dc_project.js"
import { DcProjectZipConverter } from "../formats/project/dc_project_zip_converter.js"
import { RemoteProject } from "../formats/project/remote_project.js"
import { FlatShading } from "../libs/three.js"
import { doubleClickToEdit, downloadBlob, fileUploadBox, getAndDeleteFiles } from "../util/element_functions.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"
import { RemoteProjectHandler } from "./remote_project_handler.js"

export class ModelProjectPart {
    constructor(dom, pth, modellingGetter, texturePart, animationPart) {
        this.pth = pth
        this.modellingGetter = modellingGetter
        this.texturePart = texturePart
        this.animationPart = animationPart
        this.emptyModelEntry = dom.find('.model-list-entry.empty-column')

        this.zipHandler = new DcProjectZipConverter(pth, this, texturePart, animationPart)

        this.projectSelectList = new LinkedSelectableList(null, true).onchange(v => pth.selectIndex(parseInt(v.value)))
        this.remoteProjects = new RemoteProjectHandler(pth, this, texturePart, animationPart)

        pth.addEventListener('newproject', e => this.initiateEntry(e.project))
        pth.addEventListener('deleteproject', e => this.projectSelectList.remove(e.project._element))
        pth.addEventListener('selectchange', e => this.projectSelectList.setValue(e.to, true))

        dom.find('.new-model-button').click(() => pth.createNewProject())

        dom.find('#model-file-input').on('input', e => this.loadModelFiles(getAndDeleteFiles(e)))
        fileUploadBox(dom.find('.model-drop-area'), files => this.loadModelFiles(files))

        dom.find('#project-file-input').on('input', e => this.loadProjectFiles(getAndDeleteFiles(e)))


    }
    
    async loadModelFiles(files) {
        [...files].forEach(file => DCMModel.loadModel(readFile(file), file.name, this.texturePart).then(model => this.pth.createNewProject(model)))
    }

    async loadProjectFiles(files) {
        [...files].forEach(file => this.zipHandler.readFile(file))
    }

    addReferenceImage(img, name) {
        return this.modellingGetter().referenceImageHandler.addImage(img, name)
    }

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
            DCMModel.writeModel(model).downloadAsFile(model.fileName + ".dcm")
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