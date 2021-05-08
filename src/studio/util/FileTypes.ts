export const FileSystemsAccessApi = window.showOpenFilePicker !== undefined
if (FileSystemsAccessApi) {
  console.log("Using FileSystemAccess where available.")
}

export type ReadableFile = {
  asFile: () => File | PromiseLike<File>
  asWritable?: () => WritableFile
  name: string
}

export type WritableFile = {
  write: (blob: Blob) => void
}

// const WritableFileRefreshLoop

export const createReadableFile = (file: File): ReadableFile => { 
  return { 
    asFile: () => file,
    name: file.name
   } 
}
export const createReadableFileExtended = (handle: FileSystemFileHandle): ReadableFile => {
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
    },
    name: handle.name
  }
}

export const readFileDataUrl = (file: ReadableFile) => {
  return new Promise<string>(async (resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsDataURL(await file.asFile())
  })
}

export const readFileArrayBuffer = (file: ReadableFile) => {
  return new Promise<ArrayBuffer>(async (resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = error => reject(error)
    reader.readAsArrayBuffer(await file.asFile())
  })
}