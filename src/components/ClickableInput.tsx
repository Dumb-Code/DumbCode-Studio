import { FC, useRef } from "react"
import { createWriteableFile, FileSystemsAccessApi, ReadableFile } from "../studio/util/FileTypes"

type Props = {
  description: string
  accept: string[]
  multiple?: boolean
  onFile: (file: ReadableFile) => void
  className?: string
}

const ClickableInput: FC<Props> = (props) => {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        onChange={e => {
          const files = e.currentTarget.files
          if(files !== null) {
            for(let i = 0; i < files.length; i++) {
              const file = files.item(i)
              if(file !== null) {
                props.onFile({ asFile: () => Promise.resolve(file) })
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
      res.forEach(handle => props.onFile({
        asFile: () => handle.getFile(),
        asWritable: () => createWriteableFile(handle)
      }))
    }).catch(() => {})
  }
  return (
    <button className={props.className} children={props.children} onClick={onClick}/>
  )
}



export default (FileSystemsAccessApi ? ExtendedFilesClickableInput : ClickableInput)
// export default ClickableInput