import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { MoveableDividerArea } from "../DividerArea";
import { GridSchema } from "../GridSchema";
import StudioGridDivider from "./StudioGridDivider";

const StudioGrid = ({ schema, children }: { schema: GridSchema, children?: ReactNode }) => {

  //Converts the `schema.grid.areas` into a grid of those area names
  const computedTemplateAreas = useMemo(() => {
    return schema.grid.areas.reduce((result, rows) => {
      const rowText = rows.map(col => col.gridName).join(" ");
      return `${result} "${rowText}"`;
    }, "")
  }, [schema.grid.areas]);

  const templateColumns = useChangeableAxisValue(schema, "columns");
  const templateRows = useChangeableAxisValue(schema, "rows");

  const allMoveableAreas = useMemo(() => {
    return [schema.areas.columns, schema.areas.rows].flat()
      .filter((area): area is MoveableDividerArea => area.moveableData !== undefined)
  }, [schema]);

  return (
    <div className="h-full grid relative"
      style={{
        gridTemplateAreas: computedTemplateAreas,
        gridTemplateColumns: templateColumns,
        gridTemplateRows: templateRows,
      }}
    >
      {children}
      {allMoveableAreas.map(area => (
        <StudioGridDivider key={area.moveableData.uniqueId} divider={area} />
      ))}
    </div>
  )

}

const useChangeableAxisValue = (schema: GridSchema, axis: "columns" | "rows") => {
  const areas = schema.areas[axis]
  const computeAreaText = useCallback(() => {
    return areas.map(col => col.areaValue.value).join(" ")
  }, [areas]);

  const [area, setArea] = useState(computeAreaText);

  //Listen to all the axis values, in case they change
  useEffect(() => {
    //Make a copy in case it changes (even though it shouldn't)
    const axisCopy = Array.from(areas)

    const onChanged = () => {
      setArea(computeAreaText())
    }

    axisCopy.forEach(col => {
      col.areaValue.addPostListener(onChanged)
    })
    return () => {
      axisCopy.forEach(col => {
        col.areaValue.removePostListener(onChanged)
      })
    }
  }, [areas, computeAreaText, setArea]);

  return area
}

export default StudioGrid;