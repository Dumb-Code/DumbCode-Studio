import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { MoveableDividerArea } from "../DividerArea";
import { GridSchema } from "../GridSchema";
import StudioGridDivider from "./StudioGridDivider";

const StudioGrid = ({ schema, children }: { schema: GridSchema, children?: ReactNode }) => {

  //Converts the `schema.grid.areas` into a grid of those area names
  //This should never really change, but it's a good idea to keep it in a hook
  const computedTemplateAreas = useMemo(() => {
    return schema.grid.areas.reduce((result, rows) => {
      const rowText = rows.map(col => col.gridName).join(" ");
      return `${result} "${rowText}"`;
    }, "")
  }, [schema.grid.areas]);


  const templateColumns = useChangeableAxisValue(schema, "columns");
  const templateRows = useChangeableAxisValue(schema, "rows");

  //This is all the moveable areas in the grid. 
  //We iterate over this to create the dividers
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

//A hook to take in a schema and an axis and return the value of that axis
//Also listens for changes to the axis and updates the value when they occur
const useChangeableAxisValue = (schema: GridSchema, axis: "columns" | "rows") => {
  const areas = schema.areas[axis]

  //Function to re-compute the values of the axis
  const computeAreaText = useCallback(() => {
    return areas.map(col => col.areaValue.value).join(" ")
  }, [areas]);

  const [area, setArea] = useState(computeAreaText);

  //Listen to all the axis values, in case they change
  useEffect(() => {
    //Make a copy in case it changes (even though it shouldn't)
    const axisCopy = Array.from(areas)

    //When any of the axis values change, update the state.
    //We use a post listener here, as in a normal listener
    //The `.value` wouldn't have updated when the listener is called.
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