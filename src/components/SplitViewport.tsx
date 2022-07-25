import { ReactNode, useState } from "react"
import SelectedCubeUndoRedoHandler from "../studio/undoredo/SelectedCubeUndoRedoHandler"
import StudioCanvas from "./StudioCanvas"


export const SplitViewport = ({ children, otherName, selectedCubeHandlerUndoRedo }: { children: ReactNode, otherName: string, selectedCubeHandlerUndoRedo?: SelectedCubeUndoRedoHandler<any> }) => {

  const [showModel, setShowModel] = useState(true)
  const [showOther, setShowOther] = useState(true)

  return (
    <div className="w-full h-full">
      <div className="flex flex-row h-full w-full">
        {showModel && (
          <div className="w-full border-r dark:border-black border-white border-b group">
            <button className="transition-opacity opacity-0 group-hover:opacity-100 dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => setShowOther(!showOther)}>Model</button>
            <StudioCanvas selectedCubeHandlerUndoRedo={selectedCubeHandlerUndoRedo} />
          </div>
        )}
        {showOther && (
          <div className=" dark:bg-gray-700 bg-gray-200 w-full border-l dark:border-black border-white group">
            <button className="transition-opacity opacity-0 group-hover:opacity-100 dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => setShowModel(!showModel)}>{otherName}</button>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

