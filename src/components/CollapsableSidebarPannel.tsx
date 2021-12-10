import { FC } from "react";
import { PanelValue, StudioPanelsContext, usePanelValue } from "../contexts/StudioPanelsContext";
import { MinimizeButton } from "./MinimizeButton";

const CollapsableSidebarPannel: FC<{ panelName: { [K in keyof StudioPanelsContext]: StudioPanelsContext[K] extends PanelValue<boolean> ? K : never }[keyof StudioPanelsContext], heightClassname: string, title: string }> = ({ panelName, heightClassname, children, title }) => {
    const [open, setOpen] = usePanelValue(panelName)

    return (
        <div className={(heightClassname === "h-full" && "h-full ") + "rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden pb-1"}>
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">{title}</p>
                <MinimizeButton active={open} toggle={() => setOpen(!open)} />
            </div>
            <div className={(open ? heightClassname : "h-0 hidden") + " transition-height ease-in-out duration-200 overflow-hidden"}>
                {children}
            </div>
        </div>
    )

}

export default CollapsableSidebarPannel;