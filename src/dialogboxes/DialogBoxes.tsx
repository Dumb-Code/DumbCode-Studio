import { Dialog, Transition } from "@headlessui/react"
import React, { FC, Fragment, useContext, useState } from "react"

type DialogContextType = {
  setDialogBox: (val: () => JSX.Element) => void
}
const DialogContext = React.createContext<DialogContextType>({
  setDialogBox: () => {}
})

type OpenedDialogContextType = {
  clear: () => void
  showDialogBox: boolean
}
const OpenedDialogContext = React.createContext<OpenedDialogContextType>({
  clear: () => {},
  showDialogBox: false,
})

const DialogBoxes: FC = ({children}) => {
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
        { ElementFunc !== null && <ElementFunc /> }
      </OpenedDialogContext.Provider>
      {children}
    </DialogContext.Provider>
  )
}

export const OpenedDialogBox: FC<{className?: string, title: () => JSX.Element}> = ({title: Title, className = "", children}) => {
  const dialogBox = useOpenedDialogBoxes()

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
      className={"fixed inset-0 z-10 aa " + className}
    >
      <div id="DialogCloseBoundry" className="min-h-screen px-4 text-center bg-gray-800 bg-opacity-60" onClick={e => e.currentTarget.id === "DialogCloseBoundry" && dialogBox.clear()}>
          <Dialog.Overlay />
          <div onClick={e => e.stopPropagation()} className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <Dialog.Title><Title /></Dialog.Title>
            {children}
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export const useDialogBoxes = () => useContext(DialogContext) 
export const useOpenedDialogBoxes = () => useContext(OpenedDialogContext) 
export default DialogBoxes