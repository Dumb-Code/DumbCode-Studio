import { ReactNode } from "react"

export const OptionSet = <T extends string | number>({
  options, selected, setSelected, title,
  labelGetter = (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1)
}: {
  options: readonly T[]
  selected: T
  setSelected: (value: T) => void
  title: string
  labelGetter?: (value: T) => string
}) => {
  return (
    <div className="flex flex-col w-full m-2">
      <div className="dark:text-white text-black font-semibold pl-2">{title}</div>
      {options.map(option => <OptionButton key={option} isSelected={option === selected} toggle={() => setSelected(option)}>{labelGetter(option)}</OptionButton>)}
    </div>
  )
}

const OptionButton = ({ isSelected, toggle, children }: { isSelected: boolean, toggle: () => void, disabled?: boolean, children: ReactNode }) => {
  return (
    <button
      className={
        (isSelected ? "ring-2 ring-sky-500 bg-blue-400" : "dark:bg-gray-600 bg-gray-300") +
        " transition-colors duration-200 rounded w-full text-left pl-4 my-1 py-1 " +
        " dark:text-white text-black"}
      onClick={toggle}
    >
      {children}
    </button>
  )
}