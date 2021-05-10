import { useState } from "react"

const AppearangeOptions = () => {

    const [darkMode, setDarkMode] = useState(true);
    const [compactMode, setCompactkMode] = useState(false);

    return(
        <div className="">
            <p className="text-white font-semibold mb-2">APPEARANCE OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">THEME SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to cusomize the interface to your liking.</p>
            <button className={(!darkMode || "ring-2 ring-lightBlue-500") + " bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1"} onClick={() => setDarkMode(true)}>Dark Mode</button>
            <br />
            <button className={(darkMode || "ring-2 ring-lightBlue-500") + " bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1"} onClick={() => setDarkMode(false)}>Light Mode</button>

            <p className="text-gray-900 text-xs font-semibold mt-4">MODE SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to fine tune some of the layouts.</p>
            <button className={(compactMode || "ring-2 ring-lightBlue-500") + " bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1"}>Normal Mode</button>
            <br />
            <button className={(!compactMode || "ring-2 ring-lightBlue-500") + " bg-gray-600 rounded w-80 text-gray-800 font-semibold p-2 text-left pl-4 my-1 cursor-not-allowed"}>Compact Mode</button>
        </div>
    )
}

export default AppearangeOptions