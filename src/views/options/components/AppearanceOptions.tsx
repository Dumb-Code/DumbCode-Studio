import { useState } from "react"

const AppearangeOptions = () => {

    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [compactMode, setCompactMode] = useState(false);

    function setDark(dark) {
        if (!dark) {
            document.documentElement.classList.remove('dark')
            setDarkMode(false)
            console.log("turned off dark mode")
        } else {
            document.documentElement.classList.add('dark')
            setDarkMode(true)
            console.log("turned on dark mode")
        }
    }

    return(
        <div className="">
            <p className="text-black dark:text-white font-semibold mb-2">APPEARANCE OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">THEME SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to cusomize the interface to your liking.</p>
            <button className={(!darkMode || "ring-2 ring-lightBlue-500") + " dark:bg-gray-800 bg-gray-300 rounded w-80 dark:text-white text-black font-semibold p-2 text-left pl-4 my-1"} onClick={() => setDark(true)}>Dark Mode</button>
            <br />
            <button className={(darkMode || "ring-2 ring-lightBlue-500") + " dark:bg-gray-800 bg-gray-300 rounded w-80 dark:text-white text-black font-semibold p-2 text-left pl-4 my-1"} onClick={() => setDark(false)}>Light Mode</button>

            <p className="text-gray-900 text-xs font-semibold mt-4">MODE SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to fine tune some of the layouts.</p>
            <button className={(compactMode || "ring-2 ring-lightBlue-500") + " dark:bg-gray-800 bg-gray-300 rounded w-80 dark:text-white text-black font-semibold p-2 text-left pl-4 my-1"} onClick={() => setCompactMode(false)}>Normal Mode</button>
            <br />
            <button className={(!compactMode || "ring-2 ring-lightBlue-500") + " dark:bg-gray-600 bg-gray-400 rounded w-80 dark:text-gray-800 text-gray-600 font-semibold p-2 text-left pl-4 my-1 cursor-not-allowed"}>Compact Mode</button>
        </div>
    )
}

export default AppearangeOptions