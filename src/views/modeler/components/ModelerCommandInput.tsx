import { SVGTerminal } from "../../../components/Icons"

const ModelerCommandInput = () => {
    return(
        <div className="has-tooltip">
            {/* Actual Command input region */}
            <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex flex-row">
                <div className="w-8 dark:text-white text-black">
                    <SVGTerminal className="h-8 w-8 p-1" />
                </div>
                <input type="text" className="text-xs dark:bg-gray-900 bg-gray-200 dark:text-gray-300 text-black border-none flex-grow focus:outline-none focus:ring-0" placeholder="type your command here" />
            </div>
            {/* Active command feedback */}
            <div className="relative inline-block z-50 transform translate-x-10 text-xs mt-1 text-white">
                <p className="underline">command: snap</p>
                click on first snap point<br/>
            </div>
            {/* Command feedback history */}
            <div className="tooltip transform translate-x-10 text-xs mt-1 dark:text-gray-400 text-gray-800">
                <p className="underline">command: mirror y</p>
                12 cubes mirrored<br/>
                <p className="underline">command: refImages</p>
                opening reference images dialogue...<br/>
                <p className="underline">command: snap</p>
                click on first snap point<br/>
                click on target snap point<br/>
                6 objects moved
            </div>
        </div>
    )
}

export default ModelerCommandInput;