export class GithubCommiter {

    constructor(token, repo, branch) {
        this.token = token
        this.repo = repo
        this.files = []
        this.dirsToRemoveFiles = []

        if(!branch) {
            this.startingBranch = this.request()
            .then(r => this.branch = r.default_branch)
        } else {
            this.branch = branch
        }
    }

    addFile(path, content, base64 = false) {
        this.files.push( { path, content: { content, base64 } }) //content: base64 ? content : atob(content)
    }

    removeRedundentFiles(directory, fileNamePredicate = () => true) {
        this.dirsToRemoveFiles.push( { directory, fileNamePredicate })
    }

    async submit(message, progress = () => {}, state = () => {}) {
        await this.startingBranch
        let parentCommit = await this.request(`branches/${this.branch}`).then(r => r.commit.sha)
        let rootObject = await this._generateObject(parentCommit, "")
        progress()

        let totalFolders = new Set(
            this.files.map(file => {
                let split = file.path.split('/')
                return [...Array(split.length - 1).keys()].map(i => split.slice(0, i+1).join("/"))
            }).flat()
        ).size
        let count = 0
        let updateFolders = () => {
            state(`Preparing Git Tree (${count}/${totalFolders} total)`)
            progress(count / totalFolders)
            count++
        }
        updateFolders()
        for(let f = 0; f < this.files.length; f++) {
            let file = this.files[f]
            let parent = rootObject
            let split = file.path.split('/')
            for(let i = 0; i < split.length; i++) {
                let part = split[i]
                if(i === split.length - 1) { //Last entry
                    if(parent.objects[part] !== undefined) {
                        console.warn(`Tried setting ${file.path} but it was already set`)
                    } else {
                        parent.objects[part] = file.content
                    }
                } else {
                    if(parent.children[part] === undefined) {
                        parent.children[part] = await this._generateObject(parent?.tree?.find(o => o.path === part && o.type === "tree")?.sha, split.slice(0, i+1).join("/"))
                        updateFolders()
                    }
                    parent = parent.children[part]
                }
            }
        }
        
        let countObjects = root => {
            let count = 0
            for(let _ in root.objects) {
                count++
            }
            for(let child in root.children) {
                count += countObjects(root.children[child])
            }
            return count + 1
        }
        let totalElements = countObjects(rootObject)
        count = 0

        let getInsertIndex = (tree, path) => {
            let idx = tree.findIndex(o => o.path === path)
            return idx === -1 ? tree.length : idx
        }

        let updateSha = () => {
            state(`Generating Git Tree (${count}/${totalElements} objects)`)
            progress(count / totalElements)
            count++
        }
        updateSha()
        let createObjectSha = async(root) => {
            let tree = root.tree
            for(let child in root.children) {
                tree[getInsertIndex(tree, child)] = {
                    path: child,
                    mode: '040000',
                    type: 'tree',
                    sha: await createObjectSha(root.children[child], false)
                }
            }

            for(let object in root.objects) {
                let data = root.objects[object]
                tree[getInsertIndex(tree, object)] = {
                    path: object,
                    mode: '100644',
                    type: 'blob',
                    sha: await this.post(`git/blobs`, {
                        content: data.content,
                        encoding: data.base64 ? 'base64' : 'utf-8'
                    }).then(r => r.sha)
                }
                updateSha()
            }
            
            return this.post(`git/trees`, { tree }).then(r => { updateSha(); return r.sha } )
        }
        let sha = await createObjectSha(rootObject)
        state(`Pushing to github`)
        progress()
        let commitSha = await this.post(`git/commits`, { message, tree: sha, parents: [parentCommit] } ).then(r => r.sha)
        this.post(`git/refs/heads/${this.branch}`, { sha: commitSha, force: true })
        progress()
    }

    async _generateObject(sha, path) {
        let rf = this.dirsToRemoveFiles.find(d => d.directory == path)
        if(sha) {
            return this.request(`git/trees/${sha}`)
            .then(r => { 
                let tree = r.tree.filter(f => rf === undefined || (f.type === 'tree') || !rf.fileNamePredicate(f.path))
                return { 
                    children:{}, 
                    objects:{}, 
                    tree
                } 
            })
        }
        return { objects:{}, children:{}, tree:[] }
    }

    request(data) {
        if(data) {
            data = `/${data}`
        } else {
            data = ``
        }
        return fetch(`https://api.github.com/repos/${this.repo}${data}`, { headers: { Authorization: `token ${this.token}` } }).then(r => r.json())
    }
    
    
    post(url, data = {}, method = "POST") {
        return fetch(`https://api.github.com/repos/${this.repo}/${url}`, { method, body: JSON.stringify(data), headers: { Authorization: `token ${this.token}` } }).then(r => r.json())
    }
}