import { SVGTerminal } from "../../../components/Icons"

const ModelerCommandInput = () => {
    return(
        <div className="has-tooltip">
            <div className="rounded-sm bg-gray-800 h-full flex flex-row">
                <div className="w-8 text-white">
                    <SVGTerminal className="h-8 w-8 p-1" />
                </div>
                <input type="text" className="text-xs bg-gray-900 text-gray-300 border-none flex-grow focus:outline-none focus:ring-0" placeholder="type your command here" />
            </div>
            <div className="relative z-50 transform translate-x-10 text-xs mt-1 text-white">
                <p className="underline">command: snap</p>
                click on first snap point<br/>
            </div>
            <div className="tooltip transform translate-x-10 text-xs mt-1 text-gray-400">
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