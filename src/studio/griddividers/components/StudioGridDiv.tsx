import { HTMLProps } from "react"
import { GridArea } from "../GridArea"

//A factory function to create a component that can be used to create a grid
const StudioGridDiv = ({ area, ...props }: HTMLProps<HTMLDivElement> & { area: GridArea }) => {

  return (
    <div
      {...props}
      className={`${props.className ?? ""} min-h-0 min-w-0 border dark:border-black border-white`}
      style={{
        ...props.style,
        gridArea: area.gridName,
      }}
    />
  )
}

export default StudioGridDiv