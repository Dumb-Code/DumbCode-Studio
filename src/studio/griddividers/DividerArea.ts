import { v4 } from "uuid";
import { LO } from "../listenableobject/ListenableObject";
import { GridArea } from "./GridArea";

type MoveableSide = "left" | "right" | "top" | "bottom";

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

const constant = (value: number): DividerArea => ({
  areaValue: LO.createReadonly(`${value}px`),
});
const auto = (): DividerArea => ({
  areaValue: LO.createReadonly("auto"),
});

const moveable = (from: number, to: number, area: GridArea, moveableSide: MoveableSide, start = (from + to) / 2): DividerArea => {
  const areaValue = new LO('')
  const numericValue = new LO(start)

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

type WeakDividerArea = number | 'auto' | DividerArea

const convertFromWeak = (area: WeakDividerArea): DividerArea => {
  if (typeof area === "number") {
    return constant(area);
  }
  if (area === "auto") {
    return auto();
  }
  return area;
}

const from = (columns: WeakDividerArea[], rows: WeakDividerArea[]): GridAreas => ({
  columns: columns.map(convertFromWeak),
  rows: rows.map(convertFromWeak),
});

const DividerArea = { constant, auto, from, moveable }
export default DividerArea;