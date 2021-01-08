import { RemoteProject } from "../formats/project/remote_project.js"
import { GithubCommiter } from "../github_commiter.js"
import { AsyncProgressCounter } from "../util.js"

const repoLocation = "project/remote/repositories"
const repoEditLocation = "project/remote/edit_repositories"
const repoEntryLocation = "project/remote/repository_entries"
const newEntryLocation = "project/remote/edit_remote"

/**
 * The remote project handler. Used to handle remote projects.
 */
export class RemoteProjectHandler {
    constructor(pth, mp, tp, ap) {
        this.pth = pth
        this.mp = mp //Moddeling part
        this.tp = tp //Texture part
        this.ap = ap //Animation part
        this.store = new ProjectStore()

        this.repoContainer
        this.repoTemplate
        //Get the repo location modal and set the dom elements
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

        //Get the repo edit modal and set the dom elements
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

        //Get the repo entry modal and set the dom elements
        this.entryContainer
        this.entryTemplate
        getModal(repoEntryLocation).then(html => {
            let dom = $(html)
            this.entryContainer = dom.find('.entries-container')
            this.entryTemplate = dom.find('.entry-template')
            dom.find('.add-entry').click(e => {
                this.editEntryDoms.name.val('').prop('disabled', false)
                this.editEntryDoms.model.val('')
                this.editEntryDoms.animation.val('')
                this.editEntryDoms.texture.val('')
                this.editEntryDoms.commitMsg.val('').prop('required', false)
                this.editEntryDoms.commitContainer.css('display', 'none')
                this.editEntryDoms.log.val('')
                this.editingProject = null
                openModal(newEntryLocation)
                e.stopPropagation()
            })
        })

        //Get the edit entry modal and set the dom elements
        this.editingProject = null
        this.editEntryDoms = {}
        getModal(newEntryLocation).then(html => {
            let dom = $(html)
            this.editEntryDoms.name = dom.find('.project-name')
            this.editEntryDoms.model = dom.find('.model-path')
            this.editEntryDoms.texture = dom.find('.texture-path')
            this.editEntryDoms.animation = dom.find('.animation-path')
            this.editEntryDoms.commitContainer = dom.find('.commit-container')
            this.editEntryDoms.commitMsg = dom.find('.commit-message')
            this.editEntryDoms.log = dom.find('.log-area')
            dom.submit(() => {
                let active = this.currentOpenRepo
                if(this.editingProject !== null) {
                    this.editingProject.remoteFile.model = this.editEntryDoms.model.val()
                    this.editingProject.remoteFile.animationFolder = this.editEntryDoms.animation.val()
                    this.editingProject.remoteFile.baseTextureFolder = this.editEntryDoms.texture.val()
                    this.editingProject.syncRemoteFileOnly(this.editingProject, this.editEntryDoms.commitMsg.val(), this.editEntryDoms.log).then(() => this._openRepoEntries(active))
                    this.editingProject = null
                } else {
                    let project = new RemoteProject(this.pth, this.mp, this.tp, this.ap, this.editEntryDoms.name.val(), this.createGithubInterface())
                    project.setupFromNew(
                        this.editEntryDoms.model.val(), 
                        this.editEntryDoms.animation.val(),
                        this.editEntryDoms.texture.val(), 
                        () => active.newEntries.splice(active.newEntries.indexOf(project), 1)
                    )
                    active.newEntries.push(project)
                    this._openRepoEntries(active)
                }
                return false
            })
        })
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

        dom.find('.remote-edit').click(e => {
            let data = remoteProject.remoteFile
            this.editingProject = remoteProject
            this.editEntryDoms.name.val(remoteProject.name).prop('disabled', true)
            this.editEntryDoms.model.val(data.model)
            this.editEntryDoms.animation.val(data.animationFolder)
            this.editEntryDoms.texture.val(data.baseTextureFolder)
            this.editEntryDoms.commitMsg.val('').prop('required', true)
            this.editEntryDoms.commitContainer.css('display', '')
            this.editEntryDoms.log.val('')
            openModal(newEntryLocation)
            e.stopPropagation()
        })
        
        dom.one('click', () => {
            dom.addClass('tooltip')
            let progress = new AsyncProgressCounter(1, 5, 'Downloading', (s, c) => dom.attr('data-tooltip', s + ' ' + Math.round(c * 100) + '%'))
            remoteProject.beginRunningRequests(v => progress.updateProgress(0, v))
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