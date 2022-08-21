import { v4 } from "uuid";
import { LO } from "../listenableobject/ListenableObject";
import { GridArea } from "./GridArea";

//Which side the divider is on.
type MoveableSide = "left" | "right" | "top" | "bottom";

//Represents the area value of a grid. 
//Additionally, if the divider can be moved it provides the data for the divider.
//When `moveableData.areaValueNum` is changed, `areaValue` is updated.
export type DividerArea = {
  readonly areaValue: LO<string>
  readonly moveableData?: {
    readonly uniqueId: string;
    readonly from: number
    readonly to: number
    readonly area: GridArea
    readonly moveableSide: MoveableSide
    readonly areaValueNum: LO<number>
  }
}

export type MoveableDividerArea = Required<DividerArea>

//Create a constant and 'auto' grid area
const constant = (value: number): DividerArea => ({
  areaValue: LO.createReadonly(`${value}px`),
});
const auto = (): DividerArea => ({
  areaValue: LO.createReadonly("auto"),
});

//Create a moveable grid area. All the parameters here are passed into the moveableData.
//If start is not set it is set to be inbetween the from and to values.
const moveable = (from: number, to: number, area: GridArea, moveableSide: MoveableSide, start = (from + to) / 2): DividerArea => {
  const areaValue = new LO('')
  const numericValue = new LO(start)

  //Make it so when the numericValue changes, the areaValue is updated.
  numericValue.addAndRunListener(value => areaValue.value = `${value}px`)

  return {
    areaValue,
    moveableData: {
      uniqueId: v4(),
      from, to,
      area, moveableSide,
      areaValueNum: numericValue,
    },
  }
};

export type GridAreas = {
  columns: DividerArea[];
  rows: DividerArea[];
}

//A weak divider is a way to make creating the areas easier.
//Instead of DividerArea.constant(42) you can just use 42.
//Instead of DividerArea.auto() you can just use "auto".
type WeakDividerArea = number | 'auto' | DividerArea

//Convert from the weak area to a regular area
const convertFromWeak = (area: WeakDividerArea): DividerArea => {
  if (typeof area === "number") {
    return constant(area);
  }
  if (area === "auto") {
    return auto();
  }
  return area;
}

//Zip the columns and rows together in a single grid areas object. 
//Also convert the weak areas to regular areas.
const from = (columns: WeakDividerArea[], rows: WeakDividerArea[]): GridAreas => ({
  columns: columns.map(convertFromWeak),
  rows: rows.map(convertFromWeak),
});

const DividerArea = { constant, auto, from, moveable }
export default DividerArea;