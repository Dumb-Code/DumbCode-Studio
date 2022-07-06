import { useEffect, useRef } from 'react';
export const useDomParent = <T extends HTMLElement>(element: () => HTMLElement, allowEmptyRef = false) => {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (ref.current === null) {
      if (allowEmptyRef) {
        return
      }
      throw new Error("Ref not set.")
    }
    const cloned = element()
    const currentRef = ref.current
    currentRef.appendChild(cloned)
    return () => { currentRef.removeChild(cloned) }
  }, [element, allowEmptyRef])

  return ref
}