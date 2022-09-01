import { PropsWithChildren } from "react"
import { FileInputClickOptions, getFilesFromClick } from "../studio/files/FileInputClick"

type Props = PropsWithChildren<FileInputClickOptions & {
  disabled?: boolean
  className?: string
  tooltip?: string
}>

const ClickableInput = ({ disabled, className, tooltip, children, accept, description, onFile, multiple }: Props) => {

  const onClick = () => {
    if (disabled) {
      return
    }
    getFilesFromClick({ accept, description, multiple, onFile })
  }

  return (
    <button disabled={disabled} className={className} onClick={onClick}>
      {children}
    </button>
  )
}
export default ClickableInput
