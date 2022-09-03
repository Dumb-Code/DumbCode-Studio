import { RefObject, useEffect, useRef, useState } from 'react';
import { createReadableFile, createReadableFileExtended, FileSystemsAccessApi, ReadableFile } from './FileTypes';

export const useFileUpload = <T extends HTMLElement,>(
  extensions: string[],
  onChange: (file: ReadableFile) => void,
  onFolderChange?: (folder: FileSystemDirectoryHandle) => void,
): [RefObject<T>, boolean] => {
  const ref = useRef<T>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const currentRef = ref.current;

    if (currentRef === null) {
      console.warn("File Upload Ref was not set.")
    } else {

      const validateThatDraggingFiles = (types: readonly string[] | undefined) => {
        if (types === undefined) {
          return false
        }
        return types.includes("Files")
      }

      const wrapEvent = (dragState: boolean) => {
        return (e: DragEvent) => {
          if (validateThatDraggingFiles(e.dataTransfer?.types)) {
            setDragging(dragState)
            e.preventDefault()
            e.stopPropagation()
          }
        }
      }

      const onDragEnter = wrapEvent(true)
      const onDragOver = wrapEvent(true)
      const onDragLeave = wrapEvent(false)
      const onDrop = (e: DragEvent) => {
        const items = e.dataTransfer?.items
        if (items !== undefined) {

          const validName = (name: string) => extensions.includes(name.substring(name.lastIndexOf(".")))

          const cast = function (handle: FileSystemHandle | null) {
            if (handle instanceof FileSystemFileHandle && validName(handle.name)) {
              onChange(createReadableFileExtended(handle as FileSystemFileHandle))
            }
            if (handle instanceof FileSystemDirectoryHandle) [
              onFolderChange?.(handle as FileSystemDirectoryHandle)
            ]
          }

          for (let i = 0; i < items.length; i++) {
            const item = items[i]

            if (FileSystemsAccessApi) {
              item.getAsFileSystemHandle().then((handle) => {
                cast(handle)
              })
            } else {
              const file = item.getAsFile()
              if (file !== null && validName(file.name)) {
                onChange(createReadableFile(file))
              }
            }
          }
          setDragging(false)
          e.preventDefault()
          e.stopPropagation()
        }
      }

      currentRef.addEventListener('dragenter', onDragEnter)
      currentRef.addEventListener('dragover', onDragOver)
      currentRef.addEventListener('dragleave', onDragLeave)
      currentRef.addEventListener('drop', onDrop)

      return () => {
        currentRef.removeEventListener('dragenter', onDragEnter)
        currentRef.removeEventListener('dragover', onDragOver)
        currentRef.removeEventListener('dragleave', onDragLeave)
        currentRef.removeEventListener('drop', onDrop)
      }
    }
  }, [extensions, onChange, onFolderChange])

  return [ref, dragging]
}
