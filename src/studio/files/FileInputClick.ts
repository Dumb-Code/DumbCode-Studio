import { createReadableFile, createReadableFileExtended, FileSystemsAccessApi, ReadableFile } from "./FileTypes"

export type FileInputClickOptions = {
  description: string
  accept: string[]
  multiple?: boolean
  onFile: (file: ReadableFile) => void
}

export const getFilesFromClick = ({ description, accept, multiple, onFile }: FileInputClickOptions) => {
  if (FileSystemsAccessApi) {
    getFileSystemApiFilesFromClick({ description, accept, multiple, onFile })
  } else {
    getOldFilesFromClick({ description, accept, multiple, onFile })
  }
}

const getFileSystemApiFilesFromClick = async ({ description, accept, multiple, onFile }: FileInputClickOptions) => {
  const files = await window.showOpenFilePicker({
    multiple: multiple ?? false,
    types: [{
      description: description,
      accept: {
        "custom/dumbcode": accept
      }
    }]
  })
  for (const file of files) {
    onFile(createReadableFileExtended(file))
  }
}

const getOldFilesFromClick = ({ description, accept, multiple, onFile }: FileInputClickOptions) => {
  const element = document.createElement("input")
  element.type = "file"
  element.accept = accept.join(",")
  element.multiple = multiple ?? false
  element.addEventListener("change", e => {
    const files = element.files
    if (files !== null) {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i)
        if (file !== null) {
          onFile(createReadableFile(file))
        }
      }
    }
  })
}