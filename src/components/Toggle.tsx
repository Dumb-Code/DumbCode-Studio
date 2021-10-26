import { Switch } from "@headlessui/react"

const Toggle = ({ checked, setChecked, className = "" }: { checked: boolean, setChecked: (value: boolean) => void, className?: string }) => {
  return (
    <Switch
      checked={checked}
      onChange={setChecked}
      className={`${checked ? 'bg-gray-600 dark:bg-gray-900' : 'bg-gray-300 dark:bg-gray-700'}
        relative inline-flex flex-shrink-0 h-5 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75
        ${className}  
      `}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-6' : 'translate-x-0'}
          pointer-events-none inline-block h-4 w-4 rounded-full dark:bg-gray-300 bg-white shadow-lg transform ring-0 transition ease-in-out duration-200`}
      />
    </Switch>
  )
}

export default Toggle