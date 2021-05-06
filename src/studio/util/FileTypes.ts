export type ReadableFile = {
  asFile: () => PromiseLike<File>
  asWritable?: () => WritableFile
}

export type WritableFile = {
  write: (blob: Blob) => void
}

// const WritableFileRefreshLoop

export const createWriteableFile = (file: FileSystemFileHandle): WritableFile => {
  return {
    write: async(blob) => {
      const writable = await file.createWritable()
      await writable.write(blob)
      await writable.close()
    }
  }
}

export const FileSystemsAccessApi = window.showOpenFilePicker !== undefined
if(FileSystemsAccessApi) {
  console.log("Using FileSystemAccess where available.")
}