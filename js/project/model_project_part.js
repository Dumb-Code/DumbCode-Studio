import { readFile } from "../displays.js"
import { DCMModel } from "../formats/model/dcm_loader.js"
import { doubleClickToEdit, fileUploadBox, LinkedSelectableList } from "../util.js"

export class ModelProjectPart {
    constructor(dom, pth) {
        this.pth = pth
        this.emptyModelEntry = dom.find('.model-list-entry.empty-column')

        this.projectSelectList = new LinkedSelectableList(null, true).onchange(v => pth.selectIndex(v.value))

        pth.addEventListener('newproject', e => this.initiateEntry(e.project))
        pth.addEventListener('selectchange', e => this.projectSelectList.setValue(e.to, true))

        dom.find('.new-model-button').click(() => pth.createNewProject())

        dom.find('#model-file-input').on('input', e => this.loadFile(e.target.files))
        fileUploadBox(dom.find('.model-drop-area'), files => this.loadFile(files))
    }
    
    async loadFile(files) {
        [...files].forEach(file => DCMModel.loadModel(readFile(file), file.name).then(model => this.pth.createNewProject(model)))
    }

    initiateEntry(project) {
        let model = project.model

        let cloned = this.emptyModelEntry.clone()
        cloned
            .attr('select-list-entry', project.id)
            .removeClass('empty-column')
            .insertBefore(this.emptyModelEntry)    

        this.projectSelectList.addElement(cloned)

        doubleClickToEdit(cloned.find('.model-name-container'), name => model.fileName = name, model.fileName ? model.fileName : "New Model.dca")

    }
}