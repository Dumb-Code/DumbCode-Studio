import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react"
import { v4 } from "uuid"
import { LO, useListenableObject } from "../studio/listenableobject/ListenableObject"
import UnsafeOperations from "../studio/util/UnsafeOperations"
import { useCreatePortal } from "./CreatePortalContext"

//Info IS used btw
type ToastType = "info" | "success" | "error"

type ContextType = {
  addToast: (message: Renderable, type: ToastType, duration?: number) => void
}

const timeToFadeOut = 700

type Renderable = string | (() => ReactNode)

class ToastObject {

  readonly uuid = v4()

  readonly fadingOut = new LO(false)
  readonly animatedUp = new LO(false)

  constructor(
    public readonly message: Renderable,
    public readonly type: ToastType
  ) {

  }
}

const Context = createContext<ContextType | null>(null)

export const useToast = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

const ToastContext = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastObject[]>([])
  const createPortal = useCreatePortal()

  const addToast = useCallback((message: Renderable, type: ToastType, duration = 5000) => {
    const obj: ToastObject = new ToastObject(message, type)

    obj.fadingOut.addListener(fadingOut => {
      if (fadingOut) {
        //After $timeToFadeOut ms, remove it from the list
        setTimeout(() => {
          setToasts(toasts => toasts.filter(t => t !== obj))
        }, timeToFadeOut)
      }
    })

    //This is a bit gross, but I always want the correct current toast array
    setToasts(toasts => {
      if (toasts.length >= 5) {
        //Fade out the oldest toasts if there are more than 5
        for (let i = 0; i < toasts.length - 4; i++) {
          toasts[i].fadingOut.value = true
        }
      }
      return [...toasts, obj]
    })

    //Set it to fade out after $duration ms
    setTimeout(() => {
      obj.fadingOut.value = true
    }, duration)
  }, [])

  UnsafeOperations._unsafe_AddToast = addToast

  // // Uncomment this to test the toasts
  // useEffect(() => {
  //   const test = setInterval(() => {
  //     addToast("This is a test toast " + Math.random())
  //   }, 2000)
  //   return () => clearInterval(test)
  // }, [addToast])

  const ctx = useMemo(() => ({ addToast }), [addToast])

  return (
    <Context.Provider value={ctx}>
      {children}
      {createPortal(
        <>
          {toasts.map((toast, index) => <ToastEntry key={toast.uuid} toast={toast} index={toasts.length - index - 1} />)}
        </>
      )}
    </Context.Provider>
  )
}

const ToastEntry = ({ toast, index }: { toast: ToastObject, index: number }) => {
  const [fadingOut, setFadingOut] = useListenableObject(toast.fadingOut)
  const [animatedUp, setAnimatedUp] = useListenableObject(toast.animatedUp)

  const essentialIndex = animatedUp ? index : -1


  useLayoutEffect(() => {
    if (!animatedUp) {
      //We need to set this after it's been rendered, so it animated from below the screen going up
      setTimeout(() => setAnimatedUp(true), 20)
    }
  }, [animatedUp, setAnimatedUp])


  return (
    <div
      onClick={() => setFadingOut(true)}
      className={"pointer-events-auto text-left absolute right-0 transition-all duration-200 w-80 h-20 rounded " + (fadingOut ? "" : "cursor-pointer")}
      style={{ bottom: essentialIndex * 88 + 16 }}
    >
      <div className={"transition-opacity duration-700 w-full h-full flex flex-col bg-gray-500 dark:bg-gray-900 dark:text-white m-2 p-2 rounded " + (fadingOut ? "opacity-0" : "opacity-100")}>
        {
          typeof toast.message === "string" ?
            toast.message.split("\n").map((line, index) => <p key={index}>{line}</p>) :
            toast.message()
        }
      </div>
    </div>
  )
}
export default ToastContext