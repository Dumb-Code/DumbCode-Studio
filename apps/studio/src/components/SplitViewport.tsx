import { ReactNode, useState } from "react"
import SelectedCubeUndoRedoHandler from "../studio/undoredo/SelectedCubeUndoRedoHandler"
import StudioCanvas from "./StudioCanvas"


export const SplitViewport = ({ children, otherName, selectedCubeHandlerUndoRedo }: { children: ReactNode, otherName: string, selectedCubeHandlerUndoRedo?: SelectedCubeUndoRedoHandler<any> }) => {

  const [showModel, setShowModel] = useState(true)
  const [showOther, setShowOther] = useState(true)

  return (
    <div className="w-full h-full">
      <div className="flex xl:flex-row flex-col h-full w-full">
        {showModel && (
          <div className="w-full xl:h-full h-1/2 border-r dark:border-black border-white border-b group">
            <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 px-4 rounded-br dark:text-gray-400 text-black" onDoubleClick={() => setShowOther(!showOther)}>Model</button>
            <StudioCanvas selectedCubeHandlerUndoRedo={selectedCubeHandlerUndoRedo} />
          </div>
        )}
        {showOther && (
          <div className=" dark:bg-gray-700 bg-gray-200 w-full xl:h-full h-1/2 border-l dark:border-black border-white group">
            <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 px-4 rounded-br dark:text-gray-400 text-black" onDoubleClick={() => setShowModel(!showModel)}>{otherName}</button>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

