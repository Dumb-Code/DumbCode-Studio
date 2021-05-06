export const FileSystemsAccessApi = window.showOpenFilePicker !== undefined
if (FileSystemsAccessApi) {
  console.log("Using FileSystemAccess where available.")
}

export type ReadableFile = {
  asFile: () => File | PromiseLike<File>
  asWritable?: () => WritableFile
}

export type WritableFile = {
  write: (blob: Blob) => void
}

// const WritableFileRefreshLoop

export const createReadableFile = (file: File) => { return { asFile: () => file } }
export const createReadableFileExtended = (handle: FileSystemFileHandle) => {
  return {
    asFile: () => handle.getFile(),
    asWritable: () => {
      return {
        write: async (blob) => {
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
        }
      }
    }
  }
}

