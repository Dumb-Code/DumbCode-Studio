import { useEffect, useRef } from 'react';
export const useDraggbleRef = <T extends HTMLElement, O>(
  initialGetter: (e: MouseEvent) => O,
  onDrag: (data: { dx: number, dy: number, initial: O, x: number, y: number }, event: MouseEvent) => void,
  onReleased?: (data: { max: number, dx: number, dy: number, initial: O, x: number, y: number }, event: MouseEvent) => void,
  dontUnbindWhenDestroy?: boolean,
) => {
  const ref = useRef<T>(null)

  const initialRef = useRef<O | null>(null)
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
      document.addEventListener('pointermove', mouseMove)
      document.addEventListener('pointerup', mouseUp)
      document.addEventListener('selectstart', disableEvent)
    }

    const unbindEvents = () => {
      document.removeEventListener('pointermove', mouseMove)
      document.removeEventListener('pointerup', mouseUp)
      document.removeEventListener('selectstart', disableEvent)
    }

    const disableEvent = (e: Event) => e.preventDefault()
    const mouseMove = (e: MouseEvent) => {
      const dx = e.clientX - xRef.current
      const dy = e.clientY - yRef.current

      max.current = Math.max(max.current, dx * dx + dy * dy)

      onDrag({
        dx, dy,
        initial: initialRef.current as O,
        x: e.clientX,
        y: e.clientY,
      }, e)

      e.stopPropagation()
    }
    const mouseUp = (e: MouseEvent) => {
      unbindEvents()
      if (onReleased) {
        onReleased({
          max: Math.sqrt(max.current),
          dx: e.clientX - xRef.current,
          dy: e.clientY - yRef.current,
          initial: initialRef.current as O,
          x: e.clientX,
          y: e.clientY
        }, e)
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
        initialRef.current = initialGetter(e)
        bindEvents()
        e.stopPropagation()
      }
    }

    if (isDragging.current) {
      bindEvents()
    }

    currentRef.addEventListener("mousedown", mouseDown)
    return () => {
      currentRef.removeEventListener("mousedown", mouseDown)
      if (dontUnbindWhenDestroy !== true) {
        unbindEvents()
      }
    }
  }, [dontUnbindWhenDestroy, initialGetter, onDrag, onReleased])
  return ref
}