/**
 * Allows the commiting and deleting and such of files to github.
 * 
 * Note there currently isn't any functionality to remove files.
 */
export class GithubCommiter {

    /**
     * @param {string} token api token
     * @param {string} repo ${repository}/${name}
     * @param {string} branch branch
     */
    constructor(token, repo, branch) {
        this.token = token
        this.repo = repo
        this.files = []
        this.dirsToRemoveFiles = []

        //If we're not on a branch then we need to figure out the default branch.
        if(!branch) {
            this.startingBranch = this.request()
            .then(r => this.branch = r.default_branch)
        } else {
            this.branch = branch
        }
    }

    /**
     * Adds a file to be commited.
     * @param {string} path the files path
     * @param {string} content the files content
     * @param {boolean} base64 whether the files content is in base64 or not
     */
    addFile(path, content, base64 = false) {
        this.files.push( { path, content: { content, base64 } }) //content: base64 ? content : atob(content)
    }

    /**
     * Removes the redndent files in a directory.
     * @param {string} directory the directory to untracked files from
     * @param {function} fileNamePredicate predicate for if a file name should be removed.
     */
    removeRedundentFiles(directory, fileNamePredicate = () => true) {
        this.dirsToRemoveFiles.push( { directory, fileNamePredicate })
    }

    /**
     * Commits these changes to github.
     * @param {string} message The commit message
     * @param {function} progress The progress callback
     * @param {function} state The state change callback  
     */
    async submit(message, progress = () => {}, state = () => {}) {
        //If we have a starting branch, wait for it to finish.
        await this.startingBranch
        //Get the parent commit object
        let parentCommit = await this.request(`branches/${this.branch}`).then(r => r.commit.sha)
        
        //Generate the root tree
        let rootObject = await this._generateObject(parentCommit, "")
        progress()

        //Get a the count of all total folders to be prepared.
        let totalFolders = new Set(
            this.files.map(file => {
                let split = file.path.split('/')
                return [...Array(split.length - 1).keys()].map(i => split.slice(0, i+1).join("/"))
            }).flat()
        ).size
        let count = 0
        //The update callback function.
        let updateFolders = () => {
            state(`Preparing Git Tree (${count}/${totalFolders} total)`)
            progress(count / totalFolders)
            count++
        }
        updateFolders()
        //For every file:
        for(let f = 0; f < this.files.length; f++) {
            let file = this.files[f]
            //Get the list of folder locations
            let split = file.path.split('/')
            //The first parent is the root object
            let parent = rootObject
            for(let i = 0; i < split.length; i++) {
                //Get the folder name
                let part = split[i]
                
                //If the entry is the final object (ie the file), then we set the content in the tree
                if(i === split.length - 1) {
                    if(parent.objects[part] !== undefined) {
                        console.warn(`Tried setting ${file.path} but it was already set`)
                    } else {
                        parent.objects[part] = file.content
                    }
                } else {
                    //If the child part doesn't exist (the tree hasn't been created), then we need to create it.
                    if(parent.children[part] === undefined) {
                        parent.children[part] = await this._generateObject(parent?.tree?.find(o => o.path === part && o.type === "tree")?.sha, split.slice(0, i+1).join("/"))
                        updateFolders()
                    }

                    //Set the parent to be this folders parent.
                    parent = parent.children[part]
                }
            }
        }
        
        //Recursive function to make easy counting of objects to generate.
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

        //Get the insert index for the path.
        //If the path isn't in the tree, then get the last index.
        let getInsertIndex = (tree, path) => {
            let idx = tree.findIndex(o => o.path === path)
            return idx === -1 ? tree.length : idx
        }

        //Update the sha generation callback.
        let updateSha = () => {
            state(`Generating Git Tree (${count}/${totalElements} objects)`)
            progress(count / totalElements)
            count++
        }
        updateSha()
        //Recursive function to genereate an object sha.
        //The reason this is recursive, as the object tree that the sha is generated on
        //relies on the child element shas. This means we need to do the child
        //objects first.
        let createObjectSha = async(root) => {
            let tree = root.tree
            //Genereate the subfolders
            for(let child in root.children) {
                tree[getInsertIndex(tree, child)] = {
                    path: child,
                    mode: '040000',
                    type: 'tree',
                    sha: await createObjectSha(root.children[child], false)
                }
            }

            //Generate the files.
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
            //Genereate the sha from this tree
            return this.post(`git/trees`, { tree }).then(r => { updateSha(); return r.sha } )
        }
        //Generate the sha for the root object.
        let sha = await createObjectSha(rootObject)
        state(`Pushing to github`)
        progress()
        //Create the commit sha and push it
        let commitSha = await this.post(`git/commits`, { message, tree: sha, parents: [parentCommit] } ).then(r => r.sha)
        this.post(`git/refs/heads/${this.branch}`, { sha: commitSha, force: true })
        progress()
    }

    /**
     * Generates an object for the tree sha and the path. Each object represents a folder in the repository.
     * Obejcts is in the following format:
     *  {
     *      children: {} //A dictonary like object holding the children generated objects
     *      object: {}   //A directory like object holding the files in this folder. These objets are the objects created in #addFile
     *      tree:        //The git tree for this folder. Will be mutated if files or subfolders are changed.
     *  }
     * 
     * EXAMPLE:
     * A directory of the following:
     * .
     * ├───folder
     * │   ├───CoolImage.png (would be encoded with base64)
     * │   └───Nothing To See Here
     * │       ├───EvilPlans.html
     * │       └───Military Secrets.txt
     * └───myfile.doc
     * 
     * Would produce (excluding the git trees):
     * {
     *    ┌───
     *    | children: {
     *    │     folder: {
     *    │       ┌───
     *    │       │ children: {
     *    │       │     Nothing To See Here: {
     *    │       │       ┌───
     *    │       │       │ children: {}
     *    │       │       │ objects: {
     *    │       │       │     EvilPlans.html:  { content: ..., base64: false }, 
     *    │       │       │     Military Secrets.txt:  { content: ..., base64: false }, 
     *    │       │       │ }
     *    │       │       │ tree: ...
     *    │       │       └───
     *    │       │     }
     *    │       │ },
     *    │       │ objects: {
     *    │       │     CoolImage.png:  { content: ..., base64: true }
     *    │       │ }
     *    │       │ tree: ...
     *    │       └───
     *    │     }
     *    │ },
     *    │ objects: {
     *    │     myfile.doc:  { content: ..., base64: false }
     *    │ }
     *    │ tree: ...
     *    └───
     * }
     * 
     * @param {*} sha the tree sha to genereate the object off
     * @param {*} path the path of the folder. Used for `dirsToRemoveFiles`
     */
    async _generateObject(sha, path) {
        let rf = this.dirsToRemoveFiles.find(d => d.directory == path)
        //If the sha exists, get it. Otherwise return an new empty object.
        if(sha) {
            //Get the tree. The returned tree is a list of git elements.
            return this.request(`git/trees/${sha}`)
            .then(r => { 
                //Filter the tree. The filtering is to remove files in the tree that match the fileNamePredicate. (removes none if there is no predicate)
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

    /**
     * requests data from the github api
     * @param {string} data the url to request
     */
    request(data) {
        if(data) {
            data = `/${data}`
        } else {
            data = ``
        }
        return fetch(`https://api.github.com/repos/${this.repo}${data}`, { headers: { Authorization: `token ${this.token}` } }).then(r => r.json())
    }
    
    /**
     * posts data to the github api
     * @param {*} url the url to post to
     * @param {*} data the data to post with.
     */
    post(url, data = {}) {
        return fetch(`https://api.github.com/repos/${this.repo}/${url}`, { method: "POST", body: JSON.stringify(data), headers: { Authorization: `token ${this.token}` } }).then(r => r.json())
    }
}