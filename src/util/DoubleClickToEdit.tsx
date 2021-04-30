import { DetailedHTMLProps, HTMLAttributes, useRef, useState } from "react";

export default ({callback, current, props}:  {
  callback: (str: string) => void,
  current?: string,
  props?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
}) => {
  const [text, setText] = useState(current)
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onDoubleClick = () => {
    setEditing(true)
    ref.current?.focus()
  }

  const onEditingInput = (str: string) => {
    setText(str)
    callback(str)
  }

  const onEditingKeyUp = (key: string) => {
    if(key === "Enter") {
      setEditing(false)
    }
  }
  

  return (
    <div {...props} ref={ref} onDoubleClick={onDoubleClick}>
      {editing ? 
      <input 
        type="text" 
        value={text || ''} 
        onInput={e => onEditingInput(e.currentTarget.value)} 
        onBlur={() => setEditing(false)}
        onKeyUp={e => onEditingKeyUp(e.key)}
      />:
      <p>{text}</p>
    }
    </div>
  )
}