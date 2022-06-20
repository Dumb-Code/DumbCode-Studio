import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { LO } from '../util/ListenableObject';
import { RemoteRepo } from './../formats/project/DcRemoteRepos';

type RedundentFilesDirectory = {
  directory: string,
  fileNamePredicate: (file: string) => boolean
}
class ChangedFileData {
  constructor(
    public readonly filePath: string,
    public readonly content: string,
    public readonly base64: boolean
  ) { }
}

type GitTreeNode = RestEndpointMethodTypes['git']['createTree']['parameters']['tree'][number]


type FileChangedTree = {
  [s: string]: ChangedFileData | FileChangedTree
}

export default class GithubCommiter {
  private readonly changedFiles: ChangedFileData[] = []
  private readonly redundentFilesDirectory: RedundentFilesDirectory[] = []

  public readonly message = new LO("")

  private totalHashes = 0
  private computedHashes = 0
  constructor(
    private readonly token: string,
    private readonly repo: RemoteRepo,
    private readonly octokit = new Octokit({
      auth: token,
    })
  ) { }

  pushChange(filePath: string, content: string, base64 = false) {
    this.changedFiles.push(new ChangedFileData(filePath, content, base64))
  }

  //Removes files that havn't changed in this directory
  removeRedundentDirectory(directory: string, fileNamePredicate: (file: string) => boolean) {
    this.redundentFilesDirectory.push({ directory, fileNamePredicate })
  }

  private markHashComputed() {
    this.message.value = `Tree Nodes: ${this.computedHashes++} / ${this.totalHashes}`
  }

  async commit(commitMessage: string, commitDescription?: string) {
    const commitMessageRaw = `${commitMessage}\n\n${commitDescription}`.trim()
    const message = commitMessageRaw.length === 0 ? "New Commit" : commitMessageRaw

    const fileTree = this.createFileChangedTree()

    const rootCommit = await this.getCommitSha()
    const rootSha = await this.generateTreeSha(rootCommit, fileTree)


    this.message.value = "Generating Commit"
    const commit = await this.octokit.git.createCommit({
      owner: this.repo.owner,
      repo: this.repo.repo,
      tree: rootSha,
      message,
      parents: [rootCommit]
    })

    this.message.value = "Updating Ref Head"
    await this.octokit.git.updateRef({
      owner: this.repo.owner,
      repo: this.repo.repo,
      ref: `heads/${this.repo.branch}`,
      sha: commit.data.sha,
      force: true,
    })



  }


  private getCommitSha = async () => {
    this.message.value = `Getting Commit Head`
    const branchHead = await this.octokit.repos.getBranch({
      owner: this.repo.owner,
      repo: this.repo.repo,
      branch: this.repo.branch
    })
    return branchHead.data.commit.sha
  }

  private createFileChangedTree = () => {
    const root: FileChangedTree = {}
    this.totalHashes++
    let doneIndex = 0
    for (const file of this.changedFiles) {
      this.message.value = `Creating File Tree ${doneIndex++}/${this.changedFiles.length}`
      this.updateObjectToTree(file, file.filePath.split("/"), root)
    }
    return root
  }

  private updateObjectToTree(file: ChangedFileData, pathsRemaining: string[], parent: FileChangedTree) {
    const isFile = pathsRemaining.length === 1
    const path = pathsRemaining.shift()

    //Should never happen
    if (path === undefined) {
      console.warn("HEAD of list was empty?")
      return
    }

    this.totalHashes++
    if (isFile) {
      this.updateFileToTree(file, path, parent)
    } else {
      this.updateFolderToTree(file, path, parent, pathsRemaining)
    }
  }

  private updateFileToTree = (file: ChangedFileData, path: string, parent: FileChangedTree) => {
    if (parent[path] !== undefined) {
      console.warn("Tried to set file where path existed: " + file.filePath)
      return
    }
    parent[path] = file
  }

  private updateFolderToTree = (file: ChangedFileData, path: string, parent: FileChangedTree, pathsRemaining: string[]) => {
    const thisPath = parent[path] ??= {}
    if (thisPath instanceof ChangedFileData) {
      console.warn("Tried to set folder where file existed: " + pathsRemaining.join("/") + "/" + path)
      return
    }
    this.updateObjectToTree(file, pathsRemaining, thisPath)
  }

  private async generateTreeSha(parentSha: string | undefined, filesChanged: FileChangedTree, path?: string) {
    const tree = parentSha !== undefined ? await this.loadGitTree(parentSha, path) : []

    const pathIndex = (path: string) => {
      const index = tree.findIndex(p => p === path)
      return index === -1 ? tree.length : index
    }

    const awaiters: Promise<any>[] = []

    for (let key in filesChanged) {
      const object = filesChanged[key]
      const index = pathIndex(key)
      if (object instanceof ChangedFileData) {
        awaiters.push(this.generateFileTreeObject(key, object, index, tree))
      } else {
        awaiters.push(this.generateFolderTreeObject(key, object, index, tree))
      }
    }

    await Promise.all(awaiters)
    const response = await this.octokit.git.createTree({
      owner: this.repo.owner,
      repo: this.repo.repo,
      tree: tree
    })
    this.markHashComputed()
    return response.data.sha
  }

  private async loadGitTree(sha: string, path?: string): Promise<GitTreeNode[]> {
    let rf = path === undefined ? undefined : this.redundentFilesDirectory.find(d => d.directory == path)

    //Get the tree. The returned tree is a list of git elements.
    const resonse = await this.octokit.git.getTree({
      owner: this.repo.owner,
      repo: this.repo.repo,
      tree_sha: sha
    })

    //Filter the git tree such that it removes all redudent files. Non redundent files will be re-added
    return resonse.data.tree.filter(file => rf === undefined || file.path === undefined || file.type === 'tree' || !rf.fileNamePredicate(file.path)) as GitTreeNode[]
  }

  private async generateFileTreeObject(path: string, file: ChangedFileData, index: number, tree: GitTreeNode[]) {
    const response = await this.octokit.git.createBlob({
      owner: this.repo.owner,
      repo: this.repo.repo,
      content: file.content,
      encoding: file.base64 ? 'base64' : 'utf-8'
    })
    this.markHashComputed()
    tree[index] = {
      path,
      mode: '100644',
      type: 'blob',
      sha: response.data.sha
    }
  }

  private async generateFolderTreeObject(path: string, folderTree: FileChangedTree, index: number, tree: GitTreeNode[]) {
    const sha = await this.generateTreeSha(tree[index]?.sha ?? undefined, folderTree, path)
    tree[index] = {
      path,
      mode: '040000',
      type: 'tree',
      sha
    }
  }


}