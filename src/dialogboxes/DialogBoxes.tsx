import { Dialog, Transition } from "@headlessui/react"
import React, { FC, Fragment, useContext, useState } from "react"
import { useOptions } from "../contexts/OptionsContext"

type DialogContextType = {
  setDialogBox: (val: () => JSX.Element) => void
}
const DialogContext = React.createContext<DialogContextType | null>(null)

type OpenedDialogContextType = {
  clear: () => void
  showDialogBox: boolean
}
const OpenedDialogContext = React.createContext<OpenedDialogContextType>({
  clear: () => { },
  showDialogBox: false,
})

const DialogBoxes: FC = ({ children }) => {
  const [ElementFunc, setElementFunc] = useState<null | (() => JSX.Element)>(null)
  const [showDialogBox, setShowDialogBox] = useState(false)
  return (
    <DialogContext.Provider value={{
      setDialogBox: val => {
        setElementFunc(() => val)
        setShowDialogBox(true)
      }
    }}>
      <OpenedDialogContext.Provider value={{
        clear: () => setShowDialogBox(false),
        showDialogBox,
      }}>
        {ElementFunc !== null && <ElementFunc />}
      </OpenedDialogContext.Provider>
      {children}
    </DialogContext.Provider>
  )
}

export const OpenedDialogBox: FC<{ width?: string, height?: string, title: () => JSX.Element }> = ({ title: Title, width = "500px", height = "500px", children }) => {
  const dialogBox = useOpenedDialogBoxes()
  const { darkMode } = useOptions()

  return (
    <Transition
      appear
      show={dialogBox.showDialogBox}
      as={Fragment}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog
        as="div"
        onClose={() => dialogBox.clear()}
        className={"fixed inset-0 z-10 " + (darkMode ? "dark" : "")}
      >
        <div id="DialogCloseBoundry" className="px-4 py-4 text-center bg-black bg-opacity-80 dark:text-white h-full" onClick={e => e.currentTarget.id === "DialogCloseBoundry" && dialogBox.clear()}>
          <Dialog.Overlay />
          <div
            style={{ width, height }}
            onClick={e => e.stopPropagation()}
            className="inline-block w-full h-full max-w-full max-h-full p-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
          >
            <div className="flex flex-col w-full h-full">
              <Dialog.Title><Title /></Dialog.Title>
              <div className="flex-grow">{children}</div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export const useDialogBoxes = () => {
  const context = useContext(DialogContext)
  if (context == null) {
    throw new Error(`useDialogBoxes must be used within a DialogBoxes`)
  }
  return context
}
export const useOpenedDialogBoxes = () => {
  const context = useContext(OpenedDialogContext)
  if (context == null) {
    throw new Error(`useOpenedDialogBoxes must be used within a DialogBoxes`)
  }
  return context
}
export default DialogBoxes