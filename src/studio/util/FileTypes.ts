import { SVGDownload, SVGSave } from './../../components/Icons';
export const FileSystemsAccessApi = window.showOpenFilePicker !== undefined
if (FileSystemsAccessApi) {
  console.log("Using FileSystemAccess where available.")
}

export type ReadableFile = {
  asFile: () => File | PromiseLike<File>
  asWritable: () => WritableFile
  name: string
}

export type WritableFile = {
  write: (name: string, blob: Blob | PromiseLike<Blob>) => Promise<any>
}

// const WritableFileRefreshLoop

export const downloadBlob: WritableFile['write'] = async (name, blob) => {
  const url = window.URL.createObjectURL(await blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
  return name
}

export const defaultWritable: WritableFile = {
  write: async (name, blob) => downloadBlob(name, await blob)
}

//Gets the writeable file for where nothing has been defined.
export const getUndefinedWritable = (description: string, ...accept: string[]): WritableFile => {
  if (!FileSystemsAccessApi) {
    return defaultWritable
  }
  let saveName: string | null = null
  let file: WritableFile | null = null
  return {
    write: async (name, blob) => {
      if (file === null) {
        const picked = await window.showSaveFilePicker({
          types: [{
            description,
            accept: {
              "custom/dumbcode": accept
            }
          }]
        })
        const readable = createReadableFileExtended(picked)
        saveName = readable.name
        file = readable.asWritable()
      }

      //saveName should never by null, but if it is then test.
      file.write(saveName ?? name, blob)
      return saveName
    }
  }
}

export const createReadableFile = (file: File): ReadableFile => {
  return {
    asFile: () => file,
    name: file.name,
    asWritable: () => defaultWritable,
  }
}
export const createReadableFileExtended = (handle: FileSystemFileHandle): ReadableFile => {
  return {
    asFile: () => handle.getFile(),
    asWritable: () => {
      return {
        write: async (_, blob) => {
          const writable = await handle.createWritable()
          await writable.write(await blob)
          await writable.close()
          return handle.name
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

export const SaveIcon = FileSystemsAccessApi ? SVGSave : SVGDownload
