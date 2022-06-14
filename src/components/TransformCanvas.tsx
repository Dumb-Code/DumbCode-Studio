import { MouseEvent as ReactMouseEvent, PropsWithChildren, SVGProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SVGUndo } from './Icons';
import { ButtonWithTooltip } from './Tooltips';

export type CanvasPoint = { readonly x: number, readonly y: number }
export type CanvasMouseCallbackEvent<T extends MouseEvent | ReactMouseEvent = ReactMouseEvent> = (args: {
  originalMouse: CanvasPoint,
  transformedMouse: CanvasPoint,
  width: number,
  height: number,
  event: T,
  setHandled: () => void
}) => void
export type RedrawCallback = (width: number, height: number, ctx: CanvasRenderingContext2D) => void

//A moveable, scaleable canvas, used mainly for progression points, texture map, ect
const TransformCanvas = ({
  enabled = true, defaultScaleOut = 1,
  backgroundStyle, redraw,
  onMouseEnter, onMouseLeave, onMouseMove, onMouseMoveGlobally,
  onMouseDown, onMouseUp, onMouseUpGlobally, onWheel,
  children
}: PropsWithChildren<{
  enabled?: boolean
  defaultScaleOut?: number,
  backgroundStyle: string | CanvasGradient | CanvasPattern
  redraw: RedrawCallback

  onMouseEnter?: CanvasMouseCallbackEvent,
  onMouseLeave?: CanvasMouseCallbackEvent,
  onMouseMove?: CanvasMouseCallbackEvent,
  onMouseMoveGlobally?: CanvasMouseCallbackEvent<MouseEvent>,
  onMouseDown?: CanvasMouseCallbackEvent,
  onMouseUp?: CanvasMouseCallbackEvent,
  onMouseUpGlobally?: CanvasMouseCallbackEvent<MouseEvent>,

  onWheel?: CanvasMouseCallbackEvent<WheelEvent>,
}>) => {

  const ref = useRef<HTMLCanvasElement>(null)

  const draggingPoints = useRef<CanvasPoint>()

  const [width, setWidth] = useState(-1)
  const [height, setHeight] = useState(-1)

  const [matrix, setMatrix] = useState(new DOMMatrixReadOnly())
  const [draggingMatrix, setDraggingMatrix] = useState(new DOMMatrixReadOnly())

  const renderMatrix = useMemo((): DOMMatrixReadOnly => draggingMatrix.multiply(matrix), [draggingMatrix, matrix])

  const hasDefaultZoomedOut = useRef(false)
  const animateBackTo0Ref = useRef(-1)

  const defaultMatrix = useMemo(() => {
    const matrix = new DOMMatrix()
    matrix.translateSelf(width / 2, height / 2)
    matrix.scaleSelf(1 / defaultScaleOut)
    matrix.translateSelf(-width / 2, -height / 2)
    return matrix
  }, [width, height, defaultScaleOut])

  const mulMatrix = useCallback((other: DOMMatrixReadOnly) => {
    setMatrix(mat => other.multiply(mat))
  }, [])

  //Listen to re-render the canvas
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d") ?? null
    if (canvas === null || ctx === null) {
      return
    }

    canvas.width = width
    canvas.height = height

    if (!hasDefaultZoomedOut.current && width !== -1 && height !== -1) {
      hasDefaultZoomedOut.current = true
      mulMatrix(defaultMatrix)
    }

    //Fill background
    ctx.fillStyle = backgroundStyle
    ctx.fillRect(0, 0, width, height)

    if (enabled) {
      ctx.setTransform(renderMatrix)
      redraw(width, height, ctx)
      ctx.resetTransform()
    }


  }, [backgroundStyle, enabled, mulMatrix, width, height, renderMatrix, defaultMatrix, redraw])


  //Listen to the dimension change
  useEffect(() => {
    const canvas = ref.current
    if (canvas === null) {
      return
    }
    setWidth(canvas.clientWidth)
    setHeight(canvas.clientHeight)
    const observer = new ResizeObserver(() => {
      setWidth(canvas.clientWidth)
      setHeight(canvas.clientHeight)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  const handleEventAndPassBack = useCallback(<T extends MouseEvent | ReactMouseEvent,>(event: T, ...callbacks: (CanvasMouseCallbackEvent<T> | undefined)[]) => {
    const canvas = ref.current
    if (canvas === null) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    //Get the mouse point and transform it
    const originalMouse = new DOMPointReadOnly(event.clientX - rect.left, event.clientY - rect.top)

    const transformedMouse: DOMPointReadOnly = originalMouse.matrixTransform(matrix.inverse())

    let hasBeenHandled = false
    const args: Parameters<CanvasMouseCallbackEvent<T>>[0] = {
      originalMouse, transformedMouse, event,
      width, height,
      setHandled: () => hasBeenHandled = true
    }

    for (const callback of callbacks) {
      if (callback !== undefined) {
        callback(args)
        if (hasBeenHandled) {
          break
        }
      }
    }

    if (hasBeenHandled) {
      event.stopPropagation()
      event.preventDefault()
    }
  }, [height, width, matrix])


  //Factory for creating mouse event handlers
  const createMouseEventHandler = useCallback(<T extends MouseEvent | ReactMouseEvent,>(...callbacks: (CanvasMouseCallbackEvent<T> | undefined)[]) => (event: T) => {
    if (enabled) {
      handleEventAndPassBack(event, ...callbacks)
    }
  }, [enabled, handleEventAndPassBack])

  const onMouseMoveGloballyWhenDragging = useCallback<CanvasMouseCallbackEvent<MouseEvent>>(({ originalMouse, setHandled }) => {
    if (draggingPoints.current !== undefined && ref.current !== null) {
      setDraggingMatrix(new DOMMatrix().translate(originalMouse.x - draggingPoints.current.x, originalMouse.y - draggingPoints.current.y))
      setHandled()
    }
  }, [])


  const onMouseUpWhenDragging = useCallback<CanvasMouseCallbackEvent<any>>(({ originalMouse, setHandled }) => {
    if (draggingPoints.current !== undefined) {
      const from = draggingPoints.current
      const to = originalMouse

      //If the mouse has moved, count this as a drag, otherwise, we can count it as a click
      if (from.x !== to.x || from.y !== to.y) {
        setHandled()
      }
      mulMatrix(draggingMatrix)
      setDraggingMatrix(new DOMMatrixReadOnly())
      draggingPoints.current = undefined
    }
  }, [draggingMatrix, mulMatrix])

  const onMouseDownDeafult = useCallback<CanvasMouseCallbackEvent>(({ originalMouse, setHandled }) => {
    draggingPoints.current = originalMouse
    setHandled()
  }, [])


  const onWheelDefault = useCallback<CanvasMouseCallbackEvent<WheelEvent>>(({ originalMouse, event, setHandled }) => {
    const point = draggingPoints.current !== undefined ? draggingPoints.current : originalMouse

    const matrix = new DOMMatrix()
    matrix.translateSelf(point.x, point.y)
    matrix.scaleSelf(event.deltaY < 0 ? 1.1 : (1 / 1.1))
    matrix.translateSelf(-point.x, -point.y)
    mulMatrix(matrix)

    setHandled()
  }, [mulMatrix])


  useEffect(() => {
    if (animateBackTo0Ref.current !== -1) {
      cancelAnimationFrame(animateBackTo0Ref.current)
    }
  }, [])

  //We need to listen to the wheel event non-passively
  //Listen to the mouse move event on the document
  //Listen to the mouse up event on the document
  useEffect(() => {
    const current = ref.current
    if (current) {
      const wheelListener = createMouseEventHandler(onWheel, onWheelDefault)
      const documentMouseMove = createMouseEventHandler(onMouseMoveGloballyWhenDragging, onMouseMoveGlobally)
      const documentMouseUp = createMouseEventHandler(onMouseUpWhenDragging, onMouseUpGlobally)

      current.addEventListener('wheel', wheelListener, { passive: false })
      document.addEventListener('mousemove', documentMouseMove)
      document.addEventListener('mouseup', documentMouseUp)
      return () => {
        current.removeEventListener('wheel', wheelListener)
        document.removeEventListener('mousemove', documentMouseMove)
        document.removeEventListener('mouseup', documentMouseUp)
      }
    }
  }, [createMouseEventHandler, onWheel, onWheelDefault, onMouseMoveGloballyWhenDragging, onMouseMoveGlobally, onMouseUpWhenDragging, onMouseUpGlobally])

  const resetView = () => {
    const timeStart = Date.now()
    const duration = 100

    //As we only do translation / scale, we can literally just interpolate the matrix values

    const start = [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f]
    const end = [defaultMatrix.a, defaultMatrix.b, defaultMatrix.c, defaultMatrix.d, defaultMatrix.e, defaultMatrix.f]

    const onFrame = () => {
      const time = Date.now()
      const percent = (time - timeStart) / duration
      if (percent > 1) {
        setMatrix(defaultMatrix)
        return
      }
      const easingPercent = -(Math.cos(Math.PI * percent) - 1) / 2;
      setMatrix(new DOMMatrix(start.map((s, index) => s + (end[index] - s) * easingPercent)))
      animateBackTo0Ref.current = requestAnimationFrame(onFrame)
    }
    onFrame()
  }

  return (
    <div className="relative w-full h-full group">
      <div className={"flex flex-row-reverse transition-opacity opacity-0 absolute top-1 right-1 " + (enabled ? "group-hover:opacity-100" : "")}>
        <TransformCanvasWidget tooltip="Reset View" onClick={resetView} Icon={SVGUndo} />
        {children}
      </div>
      <canvas
        ref={ref}
        className="w-full h-full"

        onContextMenu={e => e.preventDefault()}

        onMouseEnter={createMouseEventHandler(onMouseEnter)}
        onMouseLeave={createMouseEventHandler(onMouseLeave)}
        onMouseMove={createMouseEventHandler(onMouseMove)}
        onMouseDown={createMouseEventHandler(onMouseDown, onMouseDownDeafult)}
        onMouseUp={createMouseEventHandler(onMouseUpWhenDragging, onMouseUp)}
      />
    </div>
  )
}

export const TransformCanvasWidget = ({ tooltip, onClick, Icon }: { tooltip: string, onClick: () => void, Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }) => {
  const clickAndHandle = useCallback((e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }, [onClick])
  return (
    <ButtonWithTooltip tooltip={tooltip} className="first:mr-0 mr-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-600 rounded" onClick={clickAndHandle} onMouseUp={e => e.stopPropagation()}>
      <Icon className="w-3 h-3 m-1 dark:text-white" />
    </ButtonWithTooltip>
  )
}

export default TransformCanvas