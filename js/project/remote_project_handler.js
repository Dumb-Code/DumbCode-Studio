import { RemoteProject } from "../formats/project/remote_project.js"
import { GithubCommiter } from "../github_commiter.js"
import { AsyncProgressCounter } from "../util.js"

const repoLocation = "project/remote/repositories"
const repoEditLocation = "project/remote/edit_repositories"
const repoEntryLocation = "project/remote/repository_entries"
const newEntryLocation = "project/remote/edit_remote"
export class RemoteProjectHandler {
    constructor(pth, mp, tp, ap) {
        this.pth = pth
        this.mp = mp
        this.tp = tp
        this.ap = ap
        this.store = new ProjectStore()

        this.repoContainer
        this.repoTemplate
        getModal(repoLocation).then(html => {
            let dom = $(html)
            this.repoContainer = dom.find('.repository-container')
            this.repoTemplate = dom.find('.repository-template')
            this._refreshRepositoryContainer()
            dom.find('.add-repository').click(e => {
                let data = {}
                this.store.addRepository(data)
                this._editRepoData(data)
            })
        })

        this.editRepoTarget
        this.repoEditDoms = {}
        getModal(repoEditLocation).then(html => {
            let dom = $(html)
            this.repoEditDoms.token = dom.find('.access-token')
            this.repoEditDoms.owner = dom.find('.repo-owner')
            this.repoEditDoms.name = dom.find('.repo-name')
            this.repoEditDoms.branch = dom.find('.repo-branch')

            dom.submit(() => {
                this.editRepoTarget.token = this.repoEditDoms.token.val()
                this.editRepoTarget.owner = this.repoEditDoms.owner.val()
                this.editRepoTarget.name = this.repoEditDoms.name.val()
                this.editRepoTarget.branch = this.repoEditDoms.branch.val()
                this.editRepoTarget = null
                this._refreshRepositoryContainer()
                openModal(repoLocation)
                return false
            })
        })

        this.entryContainer
        this.entryTemplate
        getModal(repoEntryLocation).then(html => {
            let dom = $(html)
            this.entryContainer = dom.find('.entries-container')
            this.entryTemplate = dom.find('.entry-template')
            dom.find('.add-entry').click(e => {
                this.editEntryDoms.name.val('').prop('disabled', false)
                this.editEntryDoms.model.val('')
                this.editEntryDoms.animation.reset()
                this.editEntryDoms.texture.reset()
                this.editEntryDoms.commitMsg.val('').prop('required', false)
                this.editEntryDoms.commitContainer.css('display', 'none')
                this.editEntryDoms.log.val('')
                openModal(newEntryLocation)
                e.stopPropagation()
            })
        })

        this.editingProject = null
        this.editEntryDoms = {}
        getModal(newEntryLocation).then(html => {
            let dom = $(html)
            this.editEntryDoms.name = dom.find('.project-name')
            this.editEntryDoms.model = dom.find('.model-path')
            this.editEntryDoms.texture = this._createNamedLocationField(dom.find('.texture-entry-field'))
            this.editEntryDoms.animation = this._createNamedLocationField(dom.find('.animation-entry-field'))
            this.editEntryDoms.commitContainer = dom.find('.commit-container')
            this.editEntryDoms.commitMsg = dom.find('.commit-message')
            this.editEntryDoms.log = dom.find('.log-area')
            dom.submit(() => {
                let active = this.currentOpenRepo
                if(this.editingProject !== null) {
                    this.editingProject.remoteFile.model = this.editEntryDoms.model.val()
                    this.editingProject.remoteFile.animationFolders = this.editEntryDoms.animation.entries()
                    let oldTextureData = this.editingProject.remoteFile.textureFolders
                    this.editingProject.remoteFile.textureFolders = this.editEntryDoms.texture.entries()
                    let newTextureData = this.editingProject.remoteFile.textureFolders
                    oldTextureData.forEach((t, i) => {
                        if(i < newTextureData.length) {
                            newTextureData[i].suffixLocations = t.suffixLocations
                        }
                    })
                    this.editingProject.ensureValidData()
                    this.editingProject.syncRemoteFileOnly(this.editingProject, this.editEntryDoms.commitMsg.val(), this.editEntryDoms.log).then(() => this._openRepoEntries(active))
                    this.editingProject = null
                } else {
                    let project = new RemoteProject(this.pth, this.mp, this.tp, this.ap, this.editEntryDoms.name.val(), this.createGithubInterface())
                    project.setupFromNew(
                        this.editEntryDoms.model.val(), 
                        this.editEntryDoms.animation.entries(),
                        this.editEntryDoms.texture.entries(), 
                        () => active.newEntries.splice(active.newEntries.indexOf(project), 1)
                    )
                    active.newEntries.push(project)
                    this._openRepoEntries(active)
                }
                return false
            })
        })
    }

    _createNamedLocationField(dom) {
        let multipleEntries = $()
        let baseEntry = dom.find('.base-entry')
        let entries = []

        let updateMultipleEntries = () => {
            multipleEntries.css('display', entries.length > 1 ? '' : 'none')
            multipleEntries.find('input').prop('required', entries.length > 1)
        }

        let newEntry = (location = '', name = '') => {
            let entry = baseEntry.clone()
            let localNeedsEntries = entry.find('.needs-multiple-entries')
            multipleEntries = multipleEntries.add(localNeedsEntries)
            entry.removeClass('base-entry persistant')
            let data = { location, name }

            entry.find('.entry-name').val(name).on('input', e => data.name = e.target.value)
            entry.find('.entry-folder').val(location).prop('required', true).on('input', e => data.location = e.target.value)
            entry.find('.remove-folder').click(() => {
                entries.splice(entries.indexOf(data), 1)
                entry.remove()
                multipleEntries = multipleEntries.not(localNeedsEntries)
                updateMultipleEntries()
            })

            entries.push(data)
            updateMultipleEntries()

            dom.append(entry)
            return entry
        }
        dom.find('.add-entry').click(() => newEntry())
        return {
            reset: current => {
                dom.children().not('.persistant').remove()
                entries.length = 0
                if(current === undefined || current.length === 0) {
                    newEntry()
                } else {
                    if(current.length === 1) {
                        newEntry(current[0].location)
                    } else {
                        current.forEach(c => newEntry(c.location, c.name))
                    }
                }
            },
            entries: () => entries
        }
    }

    _editRepoData(data) {
        this.editRepoTarget = data
        this.repoEditDoms.token.val(data.token === undefined ? '' : data.token)
        this.repoEditDoms.owner.val(data.owner === undefined ? '' : data.owner)
        this.repoEditDoms.name.val(data.name === undefined ? '' : data.name)
        this.repoEditDoms.branch.val(data.branch === undefined ? '' : data.branch)
        openModal(repoEditLocation)
    }

    _refreshRepositoryContainer() {
        this.repoContainer.children().detach()
        this.store.projects.forEach(p => {
            if(p._element === undefined) {
                p._element = this.repoTemplate.clone().removeClass('repository-template')
                p._element.find('.repository-edit').click(e => {
                    this._editRepoData(p)
                    e.stopPropagation()
                })
                p._element.click(() => this._openRepoEntries(p))
                p._owner = p._element.find('.repository-owner')
                p._name = p._element.find('.repository-name')
            }
            p._owner.text(p.owner)
            p._name.text(p.name)
            this.repoContainer.append(p._element)
        })

        this.store.cacheData()
    }

    async _openRepoEntries(current) {
        this.currentOpenRepo = current
        let gitinter = this.createGithubInterface()
        this.entryContainer.children().remove()
        let data = await gitinter.request('studio_remotes')
        data.filter(d => d.type == 'file' && d.name.endsWith('.remote')).forEach(d => {
            let name = d.name.substring(0, d.name.length-7)
            let remoteProject = new RemoteProject(this.pth, this.mp, this.tp, this.ap, name, gitinter)
            gitinter.request(d.path).then(d => {
                remoteProject.setupFromFile(d)
                this._setupRemoteProjectDom(remoteProject)
            })
        })
        current.newEntries.forEach(ne => this._setupRemoteProjectDom(ne))
        openModal(repoEntryLocation)
    }

    _setupRemoteProjectDom(remoteProject) {
        let dom = this.entryTemplate.clone().removeClass('entry-template')
        let data = remoteProject.remoteFile
        dom.find('.entry-name').text(remoteProject.name)
        this.entryContainer.append(dom)

        
        let texComboBox = dom.find('.texture-choice-select')
        let texNeeded = data.textureFolders.length > 1

        let animComboBox = dom.find('.animation-choice-select')
        let animNeeded = data.animationFolders.length > 1

        dom.find('.remote-edit').click(e => {
            let data = remoteProject.remoteFile
            this.editingProject = remoteProject
            this.editEntryDoms.name.val(remoteProject.name).prop('disabled', true)
            this.editEntryDoms.model.val(data.model)
            this.editEntryDoms.animation.reset(data.animationFolders)
            this.editEntryDoms.texture.reset(data.textureFolders)
            this.editEntryDoms.commitMsg.val('').prop('required', true)
            this.editEntryDoms.commitContainer.css('display', '')
            this.editEntryDoms.log.val('')
            openModal(newEntryLocation)
            e.stopPropagation()
        })

        if(texNeeded) {
            texComboBox.css('display', '').click(e => e.stopPropagation())
            data.textureFolders.forEach(f => {
                if(!f.name) {
                    console.warn(`Attempted choice of texures, but was given an unnamed entry '${f.location}'`)
                    return
                }
                let element = document.createElement("option")
                element.innerHTML = f.name
                texComboBox.append(element)
            })
        }
        if(animNeeded) {
            animComboBox.css('display', '').click(e => e.stopPropagation())
            data.animationFolders.forEach(f => {
                if(!f.name) {
                    console.warn(`Attempted choice of animations, but was given an unnamed entry '${f.location}'`)
                    return
                }
                let element = document.createElement("option")
                element.innerHTML = f.name
                animComboBox.append(element)
            })
        }
        

        dom.one('click', () => {
            let tex = texNeeded ? data.textureFolders.find(f => f.name == texComboBox.val()) : data.textureFolders[0]
            let anim = animNeeded ? data.animationFolders.find(f => f.name == animComboBox.val()) : data.animationFolders[0]

            dom.addClass('tooltip')
            let progress = new AsyncProgressCounter(1, 5, 'Downloading', (s, c) => dom.attr('data-tooltip', s + ' ' + Math.round(c * 100) + '%'))
            remoteProject.beginRunningRequests(anim, tex, v => progress.updateProgress(0, v))
        })
    }

    _refreshRepositoryEntries() {
        this.entryContainer.children().detach()
    }

    createGithubInterface() {
        let current = this.currentOpenRepo
        let repo = `${current.owner}/${current.name}`
        let prefix = `https://api.github.com/repos/${repo}/contents/`
        let suffix = `${current.branch?`?ref=${this.branch}`:''}`

        let requestHeaders = { headers: { Authorization: `token ${current.token}` } }
        return {
            request: url =>
                fetch(prefix+url+suffix, requestHeaders)
                .then(response => response.json()),
            commiter: () => new GithubCommiter(current.token, repo, current.branch)
        }
        
    }
}

const key = "dumbcode.remoteproject"

class ProjectStore {
    constructor() {
        this.projects = []

        let cache = localStorage.getItem(key)
        if(cache !== null) {
            JSON.parse(cache).forEach(o => this.addRepository(o))
        }
    }

    addRepository(repo) {
        repo.newEntries = []
        this.projects.push(repo)
    }

    cacheData() {
        localStorage.setItem(key, JSON.stringify(
            this.projects.map(p => { 
                return { 
                    token: p.token, 
                    owner: p.owner,
                     name: p.name, 
                     branch: p.branch 
                } 
            })
        ))
    }
}