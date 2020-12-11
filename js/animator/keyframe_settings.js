export class KeyframeSettings {
    constructor() {
        this.activeLayerData = null
        this.settingsChangeCallback = null
        this.domMarker = null
    }

    openSettings() {
        let opened = openModal('animator/keyframe_settings')
        if(this.domMarker == null) {
            return opened.then(dom => {
                this.domMarker = true
                let d = $(dom)
                d.find('.layer-mode').prop('selected', false)
                d.find('.button-discard').click(() => closeModal())
                d.find('.button-save').click(() => {
                    closeModal()
                    this.activeLayerData.definedMode = d.find('.keyframe-layer-mode-select').val() == "Defined"
                    this.settingsChangeCallback()

                    this.activeLayerData = null
                    this.settingsChangeCallback = null
                })
                return dom
            })
        } else {
            return opened
        }
    }
    
    async open(layerData, changeCallback) {
        this.activeLayerData = layerData
        this.settingsChangeCallback = changeCallback
        let dom = await this.openSettings()
        let text = dom.find(`.layer-mode[is-defined="${layerData.definedMode}"]`).attr('selected', 'selected').text()
        dom.find('.keyframe-layer-mode-select').val(text)
    }
}