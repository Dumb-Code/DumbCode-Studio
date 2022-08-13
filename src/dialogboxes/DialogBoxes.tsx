import { Dialog, Transition } from "@headlessui/react"
import React, { Fragment, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { SVGCross } from "../components/Icons"
import { useOptions } from "../contexts/OptionsContext"
import UnsafeOperations from "../studio/util/UnsafeOperations"
import ReferenceImageDialogBox from "./ReferenceImageDialogBox"

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

type JSXSetter = (val: () => JSX.Element) => void
let currentSetter: JSXSetter | null = null

UnsafeOperations._unsafe_setDialogBox = val => currentSetter?.(val)
UnsafeOperations._unsafe_OpenReferenceImage = () => currentSetter?.(() => <ReferenceImageDialogBox />)


const DialogBoxes = ({ children }: PropsWithChildren<{}>) => {
  const [ElementFunc, setElementFunc] = useState<null | (() => JSX.Element)>(null)
  const [showDialogBox, setShowDialogBox] = useState(false)


  useEffect(() => {
    if (currentSetter !== null) {
      throw new Error("Callback is already set")
    }
    currentSetter = val => {
      setElementFunc(() => val)
      setShowDialogBox(true)
    }
    return () => { currentSetter = null }
  }, [])

  const clear = useCallback(() => {
    setShowDialogBox(false)
    setElementFunc(null)
  }, [])

  return (
    <DialogContext.Provider value={{
      setDialogBox: val => currentSetter?.(val)
    }}>
      <OpenedDialogContext.Provider value={{
        clear: clear,
        showDialogBox,
      }}>
        {ElementFunc !== null && <ElementFunc />}
      </OpenedDialogContext.Provider>
      {children}
    </DialogContext.Provider>
  )
}

export const OpenedDialogBox = ({ title = "", width = "500px", height = "500px", children }: PropsWithChildren<{ width?: string, height?: string, title: string }>) => {
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
        onClose={useCallback(() => dialogBox.clear(), [dialogBox])}
        className={"fixed inset-0 " + (darkMode ? "dark" : "")}
      >
        <div id="DialogCloseBoundry" className="px-4 py-4 flex justify-center items-center bg-black bg-opacity-80 dark:text-white h-full" onClick={e => e.currentTarget.id === "DialogCloseBoundry" && dialogBox.clear()}>
          <Dialog.Overlay />
          <div
            style={{ width, height }}
            onClick={e => e.stopPropagation()}
            className="rounded-t-md inline-block w-full h-full max-w-full max-h-full overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl"
          >
            <div className="flex flex-col w-full h-full">
              <Dialog.Title>
                <div className="bg-gray-200 dark:bg-gray-900 py-1 rounded-t-md pl-4 flex flex-row pr-1">
                  <p className="flex-grow text-black dark:text-gray-400">{title.toUpperCase()}</p>
                  <div className="rounded-md bg-red-500 hover:bg-red-600 text-white p-1 w-12 text-center cursor-pointer" onClick={() => dialogBox.clear()}>
                    <SVGCross className="h-4 w-4 ml-3" />
                  </div>
                </div>
              </Dialog.Title>
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