import { HTMLProps } from "react"
import StudioGridDivFactory from "./components/StudioGridDivFactory"

export type GridArea = {
  gridName: string
  div: (props: HTMLProps<HTMLDivElement>) => JSX.Element
}
const area = (name: string): GridArea => ({
  gridName: name,
  div: StudioGridDivFactory(name)
})

export type Grid = {
  width: number
  height: number
  areas: GridArea[][]
}
const join = (...areas: GridArea[][]): Grid => {
  const width = areas[0].length
  const height = areas.length

  for (let i = 1; i < height; i++) {
    if (areas[i].length !== width) {
      throw new Error(`Grid areas must be rectangular.`)
    }
  }

  return { width, height, areas }
}

const GridArea = { join, area }
export default GridArea