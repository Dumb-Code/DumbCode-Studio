import { PropsWithChildren } from "react"
import { useTooltipRef } from "../contexts/TooltipContext"
import { createReadableFile, createReadableFileExtended, FileSystemsAccessApi, ReadableFile } from "../studio/files/FileTypes"

type Props = PropsWithChildren<{
  description: string
  accept: string[]
  disabled?: boolean
  multiple?: boolean
  onFile: (file: ReadableFile) => void
  className?: string
  tooltip?: string
}>

const ClickableInput = (props: Props) => {
  const ref = useTooltipRef<HTMLInputElement>(props.tooltip !== undefined ? () => props.tooltip : null)

  const onClick = () => {
    if (!FileSystemsAccessApi) {
      ref.current?.click()
      return
    }
    window.showOpenFilePicker({
      multiple: props.multiple ?? false,
      types: [{
        description: props.description,
        accept: {
          "custom/dumbcode": props.accept
        }
      }]
    }).then(res => {
      res.forEach(handle => props.onFile(createReadableFileExtended(handle)))
    }).catch(() => { })
  }

  return (
    <>
      <input
        disabled={props.disabled}
        ref={ref}
        onChange={e => {
          const files = e.currentTarget.files
          if (files !== null) {
            for (let i = 0; i < files.length; i++) {
              const file = files.item(i)
              if (file !== null) {
                props.onFile(createReadableFile(file))
              }
            }
          }
        }}
        className="hidden"
        accept={props.accept.join(",")}
        type="file"
        multiple={props.multiple ?? false}
      />
      <button disabled={props.disabled} className={props.className} onClick={onClick}>
        {props.children}
      </button>
    </>
  )
}
export default ClickableInput
