import { useRef, useEffect } from 'react';
export const useDraggbleRef = <T extends HTMLElement, O>(
  initialGetter: () => O,
  onDrag: (data: {dx: number, dy: number, initial: O, x: number, y: number}) => void,
  onReleased?: (data: {max: number, dx: number, dy: number, initial: O, x: number, y: number}) => void
) => {
  const ref = useRef<T>(null)

  const initialRef = useRef<O>(initialGetter())
  const isDragging = useRef(false)
  const xRef = useRef(0)
  const yRef = useRef(0)
  const max = useRef(0)
  useEffect(() => {
    const currentRef = ref.current
    if (currentRef === null) {
      throw new Error("Ref not set")
    }

    const bindEvents = () => {
      document.addEventListener('mousemove', mouseMove)
      document.addEventListener('mouseup', mouseUp)
      document.addEventListener('selectstart', disableEvent)
    }

    const unbindEvents = () => {
      document.removeEventListener('mousemove', mouseMove)
      document.removeEventListener('mouseup', mouseUp)
      document.removeEventListener('selectstart', disableEvent)
    }

    const disableEvent = (e: Event) => e.preventDefault()
    const mouseMove = (e: MouseEvent) => {
      const dx = e.clientX - xRef.current
      const dy = e.clientY - yRef.current

      max.current = Math.max(max.current, dx * dx + dy * dy)

      onDrag({
        dx, dy,
        initial: initialRef.current,
        x: e.clientX,
        y: e.clientY,
      })

      e.stopPropagation()
    }
    const mouseUp = (e: MouseEvent) => {
      unbindEvents()
      if(onReleased) {
        onReleased({
          max: Math.sqrt(max.current), 
          dx: e.clientX - xRef.current, 
          dy: e.clientY - yRef.current,
          initial: initialRef.current,
          x: e.clientX, 
          y: e.clientY
        })
      }
      isDragging.current = false
      e.stopPropagation()
    }

    const mouseDown = (e: MouseEvent) => {
      if (!isDragging.current) {
        isDragging.current = true
        xRef.current = e.clientX
        yRef.current = e.clientY
        max.current = 0
        initialRef.current = initialGetter()
        bindEvents()
        e.stopPropagation()
      }
    }

    if(isDragging.current) {
      bindEvents()
    }
    
    currentRef.addEventListener("mousedown", mouseDown)
    return () => {
      currentRef.removeEventListener("mousedown", mouseDown)
      unbindEvents()
    }
  })
  return ref
}