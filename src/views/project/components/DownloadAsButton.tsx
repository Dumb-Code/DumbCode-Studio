import { createContext, PropsWithChildren, SVGProps, useContext } from "react";
import ProjectContextMenu, { ProjectContextMenuOption } from "./ProjectContextMenu";

const DownloadAsNameContext = createContext("???")

const DownloadAsButton = ({ menuId, iconButtonClass, name, tooltip, Icon, children }: PropsWithChildren<{
  menuId: string, iconButtonClass: string,
  name: string, tooltip: string,
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}>) => {

  return (
    <DownloadAsNameContext.Provider value={name} >
      <ProjectContextMenu
        menuId={menuId + name}
        Icon={Icon}
        buttonClassName={iconButtonClass}
        tooltip={tooltip}
        title={name}
      >
        {children}
      </ProjectContextMenu>
    </DownloadAsNameContext.Provider >
  )
}


export const DownloadOption = ({ extension, exportFunction, dot = "." }: { extension: string, exportFunction: () => void, dot?: string }) => {
  const name = useContext(DownloadAsNameContext)
  return (
    <ProjectContextMenuOption onClick={exportFunction}>
      <p className="text-gray-300">{name}</p><p className="text-sky-400 font-bold">{dot}{extension}</p>
    </ProjectContextMenuOption>
  )
}
export default DownloadAsButton