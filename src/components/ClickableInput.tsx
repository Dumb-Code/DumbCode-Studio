import { FC, useRef } from "react"
import { createReadableFile, createReadableFileExtended, FileSystemsAccessApi, ReadableFile } from "../studio/util/FileTypes"

type Props = {
  description: string
  accept: string[]
  disabled?: boolean
  multiple?: boolean
  onFile: (file: ReadableFile) => void
  className?: string
}

const ClickableInput: FC<Props> = (props) => {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        disabled={props.disabled}
        ref={ref}
        onChange={e => {
          const files = e.currentTarget.files
          if(files !== null) {
            for(let i = 0; i < files.length; i++) {
              const file = files.item(i)
              if(file !== null) {
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
      <button className={props.className} children={props.children} onClick={() => ref.current?.click()}/>
    </>
  )
}

const ExtendedFilesClickableInput: FC<Props> = (props) => {
  const onClick = () => {
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
    }).catch(() => {})
  }
  return (
    <button disabled={props.disabled} className={props.className} children={props.children} onClick={onClick}/>
  )
}



export default (FileSystemsAccessApi ? ExtendedFilesClickableInput : ClickableInput)
// export default ClickableInput