export class GithubCommiter {

    constructor(token, repo, branch) {
        this.token = token
        this.repo = repo
        this.files = []
        this.dirsToRemoveFiles = new Set()

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

    removeRedundentFiles(directory) {
        this.dirsToRemoveFiles.add(directory)
    }

    async submit(message) {
        await this.startingBranch

        let parentCommit = await this.request(`branches/${this.branch}`).then(r => r.commit.sha)
        
        let rootObject = await this._generateObject(parentCommit, "")

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
                    }
                    parent = parent.children[part]
                }
            }
        }
        
        let getInsertIndex = (tree, path) => {
            let idx = tree.findIndex(o => o.path === path)
            return idx === -1 ? tree.length : idx
          }

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
            }

            return this.post(`git/trees`, { tree }).then(r => r.sha)
        }
        await createObjectSha(rootObject)
        return await createObjectSha(rootObject)
        .then(sha => this.post(`git/commits`, { message, tree: sha, parents: [parentCommit] } ))
        .then(r => this.post(`git/refs/heads/${this.branch}`, { sha: r.sha, force: true }))
    }

    async _generateObject(sha, path) {
        let rf = this.dirsToRemoveFiles.has(path)
        if(sha) {
            return this.request(`git/trees/${sha}`)
            .then(r => { 
                let tree = r.tree.filter(f => !rf || (f.type === 'tree'))
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