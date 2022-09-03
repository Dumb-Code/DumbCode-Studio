import { useState } from "react";
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel";
import NumericInput from "../../../components/NumericInput";

const ShowcaseViewSettings = () => {

  var [widthVal, setWidth] = useState(1920);
  var [heightVal, setHeight] = useState(1080);

  return (
    <CollapsableSidebarPannel title="VIEW SETTINGS" heightClassname="h-auto" panelName="showcase_imagesettings">
      <div className="px-2 py-1">
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Name</p>
        <input className="h-6 w-full bg-gray-300 dark:bg-gray-700 text-black dark:text-white text-xs pl-1" value="New View" />
      </div>
      <div className="px-2 pb-2">
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Resolution</p>
        <div className="h-6">
          <div className="flex flex-row h-6">
            <NumericInput isPositiveInteger={true} value={widthVal} onChange={setWidth} />
            <p className="px-2 -mt-0.5 text-black dark:text-gray-500">x</p>
            <NumericInput isPositiveInteger={true} value={heightVal} onChange={setHeight} />
          </div>
        </div>
      </div>
    </CollapsableSidebarPannel>
  )
}

export default ShowcaseViewSettings