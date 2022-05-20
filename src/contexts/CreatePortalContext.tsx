import { createContext, PropsWithChildren, ReactNode, ReactPortal, useContext, useRef } from "react";
import { createPortal } from "react-dom";

type CreatePortalContext = (children: ReactNode) => ReactPortal | null

const Context = createContext<CreatePortalContext | null>(null)

const CreatePortalContext = ({ children }: PropsWithChildren<{}>) => {
  const overlay = useRef<HTMLDivElement>(null)
  return (
    <Context.Provider value={node => overlay.current === null ? null : createPortal(node, overlay.current)}>
      <div ref={overlay} className="absolute z-10 pointer-events-none overflow-hidden h-full w-full"></div>
      {children}
    </Context.Provider>
  )
}

export const useCreatePortal = () => {
  const ctx = useContext(Context)
  if (ctx === null) {
    throw new Error("Must use useCreatePortal between CreatePortalContext")
  }
  return ctx
}

export default CreatePortalContext