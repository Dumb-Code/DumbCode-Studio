import { ReactNode } from "react"
import { ReadableFile } from "../../../studio/files/FileTypes"
import { useFileUpload } from "../../../studio/files/FileUploadBox"

export const ProjectFileAreaBase = ({ extensions, onChange, children, onFolderChange }: {
  extensions: string[],
  onChange: (file: ReadableFile) => void,
  onFolderChange?: (folder: FileSystemDirectoryHandle) => void,
  children?: ReactNode,
}) => {
  const [ref, isDragging] = useFileUpload<HTMLDivElement>(extensions, onChange, onFolderChange)
  return (
    <div className="flex flex-col h-full">
      <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'dark:bg-gray-800 bg-gray-100'} flex flex-col overflow-hidden flex-grow h-0`}>
        {children}
      </div>
    </div>
  )
}

export const ProjectFileAreaHeader = ({ title, children }: {
  title: string,
  children?: ReactNode,
}) => {
  return (
    <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
      <p className="flex-grow mt-1 ml-1">{title.toUpperCase()}</p>
      <p className="flex flex-row">
        {children}
      </p>
    </div>
  )
}
export const BasicProjectFileArea = ({ title, extensions, onChange, onFolderChange, children, buttons }: {
  title: string,
  extensions: string[],
  onChange: (file: ReadableFile) => void,
  onFolderChange?: (folder: FileSystemDirectoryHandle) => void,
  children?: ReactNode,
  buttons?: ReactNode,
}) => {
  return (
    <ProjectFileAreaBase extensions={extensions} onChange={onChange} onFolderChange={onFolderChange}>
      <ProjectFileAreaHeader title={title}>
        {buttons}
      </ProjectFileAreaHeader>
      <div className="overflow-y-scroll h-full w-full studio-scrollbar">
        <div className="h-0 flex flex-col m-1 mt-2">
          {children}
        </div>
      </div>
    </ProjectFileAreaBase>
  )
}
