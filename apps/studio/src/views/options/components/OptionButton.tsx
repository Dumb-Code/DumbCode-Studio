import { ReactNode } from "react"


//Don't use tailwind theme stuff directly here, as we want to allow for `forceThemeDark` to work
const OptionButton = ({ isSelected, toggle, disabled = false, forcedThemeDark, children, width = "w-80" }: { isSelected: boolean, toggle: () => void, disabled?: boolean, children: ReactNode, forcedThemeDark?: boolean, width?: string }) => {
  const choose = (dark: string, light: string) => {
    if (forcedThemeDark === true) {
      return `${dark} `
    } else if (forcedThemeDark === false) {
      return `${light} `
    }
    return `${dark} ${light} `
  }
  return (
    <div className={forcedThemeDark ? "dark" : ""}>
      <button
        className={
          `${width} pl-4 transition-colors duration-200 p-2 pr-4 rounded-md my-1 text-left flex flex-row ` +
          (isSelected ? `ring-2 ring-inset ring-sky-500 bg-blue-500 ${choose("dark:hover:bg-blue-600 dark:border-blue-600", "hover:bg-blue-400 border-blue-400")}` :
            (
              disabled ?
                `${choose("dark:bg-gray-700 dark:text-gray-800", "bg-gray-400 text-gray-600")} cursor-not-allowed` :
                choose("dark:bg-gray-800 dark:text-white dark:hover:bg-gray-900", "bg-gray-300 text-black hover:bg-gray-400")
            )
          )
        }
        onClick={toggle}
      >
        {children}
      </button>
    </div>

  )
}

export default OptionButton;