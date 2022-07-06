import { ListenableFileData } from "./FileTypes"

type FileListener = {
  lastModified: number
  file: () => File | PromiseLike<File> | null | undefined
  onChange: (file: File) => void
}

export default class FileChangeListener {

  public readonly files: FileListener[] = []

  async addFile(file: FileListener['file']) {
    const data: ListenableFileData = {
      onChange: () => { },
      dispose: () => {
        const index = this.files.indexOf(entry)
        if (index !== -1) {
          this.files.splice(index, 1)
        }
      }
    }

    const start = await file()

    const entry: FileListener = {
      file,
      onChange: file => data.onChange(file),
      lastModified: start?.lastModified ?? -1
    }
    this.files.push(entry)
    return data
  }

  onTick() {
    for (const listener of this.files) {
      this.onTickFile(listener)
    }
  }

  async onTickFile(listener: FileListener) {
    const file = await listener.file()
    if (file !== null && file !== undefined && file.lastModified !== -1 && file.lastModified > listener.lastModified) {
      console.log(`File ${file.name} changed`)
      listener.onChange(file)
    }
    if (file !== null && file !== undefined) {
      listener.lastModified = file.lastModified
    }
  }
}