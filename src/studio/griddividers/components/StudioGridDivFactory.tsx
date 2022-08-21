import { HTMLProps } from "react";

//A factory function to create a component that can be used to create a grid
const StudioGridDivFactory = (area: string) => {
  const value = (props: HTMLProps<HTMLDivElement>) => {
    return (
      <div
        {...props}
        className={`${props.className ?? ""} min-h-0 min-w-0 border dark:border-black border-white`}
        style={{
          ...props.style,
          gridArea: area,
        }}
      />
    )
  }

  return value
}

export default StudioGridDivFactory