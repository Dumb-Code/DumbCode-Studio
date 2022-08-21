import { GridAreas } from "./DividerArea";
import { Grid } from "./GridArea";

export type GridSchema = {
  grid: Grid;
  areas: GridAreas;
}

const createSchema = (grid: Grid, areas: GridAreas): GridSchema => {
  if (grid.width !== areas.columns.length) {
    throw new Error(`Width of grid (${grid.width}) does not match width of areas (${areas.columns.length}).`);
  }
  if (grid.height !== areas.rows.length) {
    throw new Error(`Height of grid (${grid.height}) does not match height of areas (${areas.rows.length}).`);
  }
  return { grid, areas };
}

const GridSchema = { createSchema };
export default GridSchema;