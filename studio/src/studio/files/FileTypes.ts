import { SVGDownload, SVGSave } from "@dumbcode/shared/icons";
import { useEffect, useState } from 'react';
import FileChangeListener from './FileChangeListener';

export const FileSystemsAccessApi = typeof window !== "undefined" && window.showOpenFilePicker !== undefined
if (FileSystemsAccessApi) {
  console.log("Using FileSystemAccess where available.")
}

export const useFileSystemAccessApi = () => {
  const [access, setAccess] = useState(true)
  useEffect(() => setAccess(FileSystemsAccessApi), [])
  return access
}

export type ListenableFileData = {
  onChange: (file: File) => void
  dispose: () => void
}

export type ListenableFile = {
  startListening: (listener: FileChangeListener) => Promise<ListenableFileData> | null
}

export type ReadableFile = {
  asFile: () => File | PromiseLike<File>
  asWritable: () => WritableFile

  name: string
} & ListenableFile

export type WritableFile = {
  write: (name: string, blob: Blob | PromiseLike<Blob>, types?: FilePickerAcceptType[]) => Promise<string>
  asReadable: () => ReadableFile | null
} & ListenableFile

export type OpenableFolder = {
  open: () => Promise<FileSystemDirectoryHandle>
  unlink?: () => void
}

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
  write: async (name, blob) => downloadBlob(name, await blob),
  startListening: () => null,
  asReadable: () => null,
}

//Gets the writeable file for where nothing has been defined.
export const getUndefinedWritable = (description: string, ...accept: string[]): WritableFile & {
  unlink?: () => void,
  getName?: () => string | undefined,
} => {
  if (!FileSystemsAccessApi) {
    return defaultWritable
  }
  let saveName: string | null = null
  let file: WritableFile | null = null
  let readable: ReadableFile | null = null
  return {
    write: async (name, blob, types) => {
      if (file === null) {
        const picked = await window.showSaveFilePicker({
          types: types ?? [{
            description,
            accept: {
              "custom/dumbcode": accept
            }
          }]
        })
        readable = createReadableFileExtended(picked)
        saveName = readable.name
        file = readable.asWritable()
      }

      //saveName should never by null, but if it is then test.
      file.write(saveName ?? name, blob)
      return saveName ?? name
    },
    startListening: (listener) => {
      return listener.addFile(() => readable?.asFile())
    },
    unlink: () => {
      saveName = null
      file = null
      readable = null
    },
    getName: () => saveName ?? undefined,
    asReadable: () => readable,
  }
}

export const wrapFolder = (folder: FileSystemDirectoryHandle): OpenableFolder => {
  return {
    open: async () => folder
  }
}

export const getUndefinedFolder = (): OpenableFolder => {
  if (!FileSystemsAccessApi) {
    return {
      open: () => { throw new Error("No file system access API available, cannot open folder.") },
      unlink: () => { }
    }
  }
  let folder: FileSystemDirectoryHandle | null = null
  return {
    open: async () => {
      if (folder === null) {
        folder = await window.showDirectoryPicker()
      }
      return folder
    },
    unlink: () => {
      folder = null
    }
  }
}

export const createReadableFile = (file: File): ReadableFile => {
  return {
    asFile: () => file,
    name: file.name,
    asWritable: () => defaultWritable,
    startListening: () => null
  }
}
export const createReadableFileExtended = (handle: FileSystemFileHandle): ReadableFile => {
  const startListening: ListenableFile['startListening'] = listener => listener.addFile(() => handle.getFile())

  const readableFile: ReadableFile = {
    asFile: () => handle.getFile(),
    asWritable: () => {
      return {
        write: async (_, blob) => {
          const writable = await handle.createWritable()
          await writable.write(await blob)
          await writable.close()
          return handle.name
        },
        startListening,
        asReadable: () => readableFile,
      }
    },
    name: handle.name,
    startListening
  }

  return readableFile
}


export const readFileDataUrl = (file: ReadableFile | File) => {
  return new Promise<string>(async (resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file instanceof File ? file : await file.asFile())
  })
}

export const readFileArrayBuffer = (file: ReadableFile | File) => {
  return new Promise<ArrayBuffer>(async (resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = error => reject(error)
    reader.readAsArrayBuffer(file instanceof File ? file : await file.asFile())
  })
}

export const readFileToImg = async (file: ReadableFile | File) => {
  const url = await readFileDataUrl(file)
  const img = document.createElement('img')
  return new Promise<HTMLImageElement>(resolve => {
    img.onload = () => resolve(img)
    img.src = url
  })
}

export const SaveIcon = FileSystemsAccessApi ? SVGSave : SVGDownload
