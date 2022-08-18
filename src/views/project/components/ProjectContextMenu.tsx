import { PropsWithChildren, ReactNode, SVGProps } from "react"
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu"
import { ButtonWithTooltip } from "../../../components/Tooltips"

const ProjectContextMenu = ({ menuId, buttonClassName, tooltip, title, iconClassName = "h-6 w-4 mr-1", Icon, children }: PropsWithChildren<{
  menuId: string, buttonClassName: string, tooltip: string,
  title: string, iconClassName?: string,
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}>) => {

  return (
    <>
      <ContextMenuTrigger id={menuId} mouseButton={0}>
        <ButtonWithTooltip
          tooltip={tooltip}
          className={buttonClassName}>
          <Icon className={iconClassName} />
        </ButtonWithTooltip>
      </ContextMenuTrigger>
      <ContextMenu id={menuId} className="bg-gray-900 rounded">
        <MenuItem>
          <div className="p-1 rounded-t bg-gray-700">{title}</div>
        </MenuItem>
        {children}
      </ContextMenu>
    </ >
  )
}


export const ProjectContextMenuOption = ({ children, onClick }: { onClick: () => void, children: ReactNode }) => {
  return (
    <MenuItem
      onClick={e => { onClick(); e.stopPropagation() }}
    >
      <div className="hover:bg-gray-700 cursor-pointer p-1 rounded m-1 flex flex-row">
        {children}
      </div>
    </MenuItem>
  )
}
export default ProjectContextMenu