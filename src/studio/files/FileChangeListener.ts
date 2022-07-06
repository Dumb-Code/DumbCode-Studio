
type FileListener = {
  lastModified: number
  file: () => File | Promise<File>
  onChange: (file: File) => void
}

export default class FileChangeListener {

  public readonly files: FileListener[] = []

  async addFile(file: FileListener['file'], onChange: FileListener['onChange']) {
    const start = await file()

    const entry = { file, onChange, lastModified: start.lastModified }
    this.files.push(entry)

    //Return a function to delete the entry from the list
    return () => {
      const index = this.files.indexOf(entry)
      if (index !== -1) {
        this.files.splice(index, 1)
      }
    }
  }

  onTick() {
    for (const listener of this.files) {
      this.onTickFile(listener)
    }
  }

  async onTickFile(listener: FileListener) {
    const file = await listener.file()
    if (file.lastModified > listener.lastModified) {
      console.log(`File ${file.name} changed`)
      listener.lastModified = file.lastModified
      listener.onChange(file)
    }
  }
}