import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { LO } from '../util/ListenableObject';
import { RemoteRepo } from './../formats/project/DcRemoteRepos';

class RedundentFilesDirectory {

  public readonly path: string

  constructor(
    public readonly directory: string,
    public readonly fileNamePredicate: (file: string) => boolean
  ) {
    this.path = directory + "/_____remove"
  }
}
class ChangedFileData {
  constructor(
    public readonly path: string,
    public readonly content: string,
    public readonly base64: boolean
  ) { }
}

type GitTreeNode = RestEndpointMethodTypes['git']['createTree']['parameters']['tree'][number]


type FileChangedTree = {
  [s: string]: ChangedFileData | FileChangedTree | RedundentFilesDirectory
}

export default class GithubCommiter {
  private readonly changedFiles: ChangedFileData[] = []
  private readonly redundentFilesDirectory: RedundentFilesDirectory[] = []

  public readonly message = new LO("")

  private totalHashes = 0
  private computedHashes = 0
  constructor(
    readonly token: string,
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
    this.redundentFilesDirectory.push(new RedundentFilesDirectory(directory, fileNamePredicate))
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

    if (rootSha === null) {
      this.message.value = "Error: Could not compute root SHA, there were no files"
      return false
    }


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

    return true

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
    let doneIndex = 0
    const totalObjects: (ChangedFileData | RedundentFilesDirectory)[] = [...this.changedFiles, ...this.redundentFilesDirectory]
    for (const file of totalObjects) {
      this.message.value = `Creating File Tree ${doneIndex++}/${totalObjects.length}`
      this.updateObjectToTree(file, file.path.split("/"), root)
    }

    this.totalHashes = this.calculateTotalHashes(root)
    return root
  }

  private calculateTotalHashes(tree: FileChangedTree) {
    let count = 2 //Each directory has 2 computes
    for (let key in tree) {
      const object = tree[key]
      if (object instanceof ChangedFileData) {
        count++
      } else if (!(object instanceof RedundentFilesDirectory)) {
        count += this.calculateTotalHashes(object)
      }
    }
    return count
  }

  private updateObjectToTree(file: ChangedFileData | RedundentFilesDirectory, pathsRemaining: string[], parent: FileChangedTree) {
    const isFile = pathsRemaining.length === 1
    const path = pathsRemaining.shift()

    //Should never happen
    if (path === undefined) {
      console.warn("HEAD of list was empty?")
      return
    }

    if (isFile) {
      this.updateFileToTree(file, path, parent)
    } else {
      this.updateFolderToTree(file, path, parent, pathsRemaining)
    }
  }

  private updateFileToTree = (file: ChangedFileData | RedundentFilesDirectory, path: string, parent: FileChangedTree) => {
    if (parent[path] !== undefined) {
      console.warn("Tried to set file where path existed: " + file.path)
      return
    }
    parent[path] = file
  }

  private updateFolderToTree = (file: ChangedFileData | RedundentFilesDirectory, path: string, parent: FileChangedTree, pathsRemaining: string[]) => {
    const thisPath = parent[path] ??= {}
    if (thisPath instanceof ChangedFileData || thisPath instanceof RedundentFilesDirectory) {
      console.warn("Tried to set folder where file existed: " + pathsRemaining.join("/") + "/" + path)
      return
    }
    this.updateObjectToTree(file, pathsRemaining, thisPath)
  }

  private async generateTreeSha(parentSha: string | undefined, filesChanged: FileChangedTree, path?: string) {
    const tree: (GitTreeNode | null)[] = parentSha !== undefined ? await this.loadGitTree(parentSha, path) : []
    this.markHashComputed()

    const pathIndex = (path: string) => {
      const index = tree.findIndex(p => p !== null && p.path === path)
      if (index === -1) {
        tree.push(null)
        return tree.length - 1
      }
      return index
    }

    const awaiters: Promise<any>[] = []

    for (let key in filesChanged) {
      const object = filesChanged[key]
      const index = pathIndex(key)
      if (object instanceof ChangedFileData) {
        awaiters.push(this.generateFileTreeObject(key, object, index, tree))
      } else if (!(object instanceof RedundentFilesDirectory)) {
        awaiters.push(this.generateFolderTreeObject(path === undefined ? key : `${path}/${key}`, key, object, index, tree))
      }
    }

    await Promise.all(awaiters)

    const nonNull = tree.filter((t): t is GitTreeNode => t !== null)
    if (nonNull.length === 0) {
      this.markHashComputed()
      return null
    }
    const response = await this.octokit.git.createTree({
      owner: this.repo.owner,
      repo: this.repo.repo,
      tree: nonNull
    })
    this.markHashComputed()
    return response.data.sha
  }

  private async loadGitTree(sha: string, path?: string): Promise<GitTreeNode[]> {
    let rf = path === undefined ? undefined : this.redundentFilesDirectory.find(d => d.path == path)

    //Get the tree. The returned tree is a list of git elements.
    const response = await this.octokit.git.getTree({
      owner: this.repo.owner,
      repo: this.repo.repo,
      tree_sha: sha
    })
    //Filter the git tree such that it removes all redudent files. Non redundent files will be re-added
    return response.data.tree.filter(file => rf === undefined || file.path === undefined || file.type === 'tree' || !rf.fileNamePredicate(file.path)) as GitTreeNode[]
  }

  private async generateFileTreeObject(path: string, file: ChangedFileData, index: number, tree: (GitTreeNode | null)[]) {
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

  private async generateFolderTreeObject(fullPath: string, path: string, folderTree: FileChangedTree, index: number, tree: (GitTreeNode | null)[]) {
    const sha = await this.generateTreeSha(tree[index]?.sha ?? undefined, folderTree, fullPath)
    if (sha === null) {
      tree[index] = null
      return
    }
    tree[index] = {
      path,
      mode: '040000',
      type: 'tree',
      sha
    }
  }


}