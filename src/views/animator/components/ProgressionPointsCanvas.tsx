import { useCallback, useRef, useState } from "react";
import TransformCanvas, { CanvasMouseCallbackEvent, CanvasPoint, RedrawCallback } from "../../../components/TransformCanvas";
import { DcaKeyframe, ProgressionPoint } from "../../../studio/formats/animations/DcaAnimation";
import { useListenableObjectNullable } from "../../../studio/util/ListenableObject";

type DraggedStartData = {
  point: ProgressionPoint;
  x: number;
  y: number;
  hasMoved?: boolean;
};
export const ProgressionPointsCanvas = ({ keyframe }: { keyframe: DcaKeyframe | null; }) => {
  const radius = 7.5;
  const [points, setPoints] = useListenableObjectNullable(keyframe?.progressionPoints, [keyframe]);

  const [hoveredPoint, setHoveredPoint] = useState<ProgressionPoint | null>(null);

  const draggedPoint = useRef<DraggedStartData>();

  const redraw = useCallback<RedrawCallback>((width, height, ctx) => {
    if (points === undefined) {
      return;
    }

    //Fill canvas area with a slightly lighter colour
    ctx.fillStyle = "hsl(0, 0%, 20%)";
    ctx.fillRect(0, 0, width, height);

    const blueColour = "hsl(204, 86%, 53%)";
    const purpleColour = "hsl(293, 86%, 53%)";

    //Blue stoke colour
    ctx.strokeStyle = blueColour;

    //Draw the box
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.stroke();

    //Draw the circles + lines for each point
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const next = points[i + 1];

      ctx.strokeStyle = point === hoveredPoint ? purpleColour : blueColour;
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = blueColour;
      ctx.beginPath();
      if (next !== undefined) {
        ctx.moveTo(point.x * width, point.y * height);
        ctx.lineTo(next.x * width, next.y * height);
      }
      ctx.stroke();
    }
  }, [points, hoveredPoint])

  const findPoint = useCallback((transformed: CanvasPoint, width: number, height: number) => points?.find(p => Math.pow(p.x * width - transformed.x, 2) + Math.pow(p.y * height - transformed.y, 2) <= 3 * radius * radius), [radius, points]);

  const onMouseDown: CanvasMouseCallbackEvent = useCallback<CanvasMouseCallbackEvent>(({ transformedMouse, width, height, setHandled }) => {
    const clickedOn = findPoint(transformedMouse, width, height);

    if (clickedOn !== undefined) {
      draggedPoint.current = {
        point: clickedOn,
        x: clickedOn.x,
        y: clickedOn.y
      };
      setHandled();
    }
  }, [findPoint]);

  const onMouseMoveGlobally = useCallback<CanvasMouseCallbackEvent<MouseEvent>>(({ transformedMouse, width, height, setHandled }) => {
    if (draggedPoint.current !== undefined && points !== undefined) {
      draggedPoint.current.hasMoved = true;
      const currentPoint = draggedPoint.current.point;
      if (!currentPoint.required) {
        currentPoint.x = transformedMouse.x / width;
      }
      currentPoint.y = transformedMouse.y / height;

      if (currentPoint.required) {
        currentPoint.x = Math.min(Math.max(currentPoint.x, 0), 1);
        currentPoint.y = Math.min(Math.max(currentPoint.y, 0), 1);
      }


      //TODO: this is gross, I need a better way of handling the state. Either:
      //  - Progression points are immutable, and create a new list every time (I like this, but it would require me to somehow keep track of the point being moved)
      //  - Progression points use LO, but it would mean I need to listen on every single progression point
      //  - Do somthing similar to threejs fiber, and have components for the progression points that "draw" onto the parent canvas somehow. 
      //For now, we just refresh the array.
      setPoints([...points]);
      setHandled();
    }
  }, [points]);

  const onMouseMove = useCallback<CanvasMouseCallbackEvent>(({ transformedMouse, width, height }) => setHoveredPoint(findPoint(transformedMouse, width, height) ?? null), [findPoint]);


  const onMouseUpGeneral = useCallback(() => {
    if (points === undefined) {
      return false;
    }
    const current = draggedPoint.current;
    if (current !== undefined) {
      if (current.hasMoved !== true && !current.point.required) {
        setPoints(points.filter(p => p !== current.point));
      }
      draggedPoint.current = undefined;
      return true;
    }
    return false;
  }, [points]);

  const onMouseUpGlobally = useCallback<CanvasMouseCallbackEvent<MouseEvent>>(({ setHandled }) => {
    if (onMouseUpGeneral()) {
      setHandled();
    }
  }, [onMouseUpGeneral]);

  const onMouseUp = useCallback<CanvasMouseCallbackEvent>(({ transformedMouse, width, height, setHandled }) => {
    if (points === undefined) {
      return;
    }
    if (draggedPoint.current === undefined) {
      const newPoint = { x: transformedMouse.x / width, y: transformedMouse.y / height };
      setPoints(points.concat(newPoint));
      setHandled();
    } else if (onMouseUpGeneral()) {
      setHandled();
    }
  }, [points]);

  const onMouseLeave = useCallback<CanvasMouseCallbackEvent>(({ setHandled }) => {
    setHoveredPoint(null);
    setHandled();
  }, []);

  return (
    <TransformCanvas
      enabled={points !== undefined}
      defaultScaleOut={1.1}
      backgroundStyle="hsl(0, 0%, 10%)"
      redraw={redraw}
      onMouseDown={onMouseDown}
      onMouseMoveGlobally={onMouseMoveGlobally}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseUpGlobally={onMouseUpGlobally}
      onMouseLeave={onMouseLeave} />
  );
};
