import { RefObject, useRef, useState, useEffect, useCallback } from 'react';
import { createReadableFile, FileSystemsAccessApi, createReadableFileExtended, ReadableFile } from './FileTypes';

export const useFileUpload = <T extends HTMLElement,>(
  extensions: string[],
  onChange: (file: ReadableFile) => void
): [RefObject<T>, boolean] => {
  const ref = useRef<T>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (ref.current === null) {
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
          for (let i = 0; i < items.length; i++) {
            const item = items[i]

            const validName = (name: string) => extensions.includes(name.substring(name.lastIndexOf(".")))

            if (FileSystemsAccessApi) {
              item.getAsFileSystemHandle().then(handle => {
                if (handle instanceof FileSystemFileHandle && validName(handle.name)) {
                  onChange(createReadableFileExtended(handle as FileSystemFileHandle))
                }
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

      ref.current.addEventListener('dragenter', onDragEnter)
      ref.current.addEventListener('dragover', onDragOver)
      ref.current.addEventListener('dragleave', onDragLeave)
      ref.current.addEventListener('drop', onDrop)

      return () => {
        if (ref.current !== null) {
          ref.current.removeEventListener('dragenter', onDragEnter)
          ref.current.removeEventListener('dragover', onDragOver)
          ref.current.removeEventListener('dragleave', onDragLeave)
          ref.current.removeEventListener('drop', onDrop)
        }
      }
    }
  }, [])

  return [ref, dragging]
}
