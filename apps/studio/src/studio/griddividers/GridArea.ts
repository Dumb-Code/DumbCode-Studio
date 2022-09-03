
//Represents a grid area in the grid.
//The `div` function is to create the div for the grid area.
export type GridArea = {
  gridName: string
}
const area = (name: string): GridArea => ({
  gridName: name
})

//Represents the cells of a grid. 
export type Grid = {
  width: number
  height: number
  areas: GridArea[][]
}
const join = (...areas: GridArea[][]): Grid => {
  const width = areas[0].length
  const height = areas.length

  //Check that all areas are the same width
  for (let i = 1; i < height; i++) {
    if (areas[i].length !== width) {
      throw new Error(`Grid areas must be rectangular.`)
    }
  }

  return { width, height, areas }
}

const GridArea = { join, area }
export default GridArea