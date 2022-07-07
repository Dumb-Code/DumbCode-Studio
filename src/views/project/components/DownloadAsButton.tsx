import { createContext, PropsWithChildren, SVGProps, useContext } from "react";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import { ButtonWithTooltip } from "../../../components/Tooltips";

const DownloadAsNameContext = createContext("???")

const DownloadAsButton = ({ menuId, iconButtonClass, name, tooltip, Icon, children }: PropsWithChildren<{
  menuId: string, iconButtonClass: string,
  name: string, tooltip: string,
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}>) => {

  return (
    <DownloadAsNameContext.Provider value={name} >
      <ContextMenuTrigger id={menuId + name} mouseButton={0}>
        <ButtonWithTooltip
          tooltip={tooltip}
          className={iconButtonClass}>
          <Icon className="h-6 w-4 mr-1" />
        </ButtonWithTooltip>
      </ContextMenuTrigger>
      <ContextMenu id={menuId + name} className="bg-gray-900 rounded">
        <MenuItem>
          <div className="p-1 rounded-t bg-gray-700">Download As</div>
        </MenuItem>
        {children}
      </ContextMenu>
    </DownloadAsNameContext.Provider >
  )
}


export const DownloadOption = ({ extension, exportFunction, dot = "." }: { extension: string, exportFunction: () => void, dot?: string }) => {
  const name = useContext(DownloadAsNameContext)
  return (
    <MenuItem
      onClick={e => { exportFunction(); e.stopPropagation() }}
    >
      <div className="hover:bg-gray-700 cursor-pointer p-1 rounded m-1 flex flex-row">
        <p className="text-gray-300">{name}</p><p className="text-sky-400 font-bold">{dot}{extension}</p>
      </div>
    </MenuItem>
  )
}
export default DownloadAsButton