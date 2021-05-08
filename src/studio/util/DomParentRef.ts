import { useEffect, useRef } from 'react';
export const useDomParent = <T extends HTMLElement>(element: () => HTMLElement) => {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (ref.current === null) {
      throw new Error("Ref not set.")
    }
    const cloned = element()
    const currentRef = ref.current
    currentRef.appendChild(cloned)
    return () => { currentRef.removeChild(cloned) }
  })

  return ref
}