import { DetailedHTMLProps, HTMLAttributes, useRef, useState } from "react";

export default ({callback, current, props}:  {
  callback: (str: string) => void,
  current?: string,
  props?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
}) => {
  const [text, setText] = useState(current)
  const [editing, setEditing] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDoubleClick = () => {
    setEditing(true)
    if(inputRef.current !== null) {
      //For some reason the display can't be NONE to display it.
      //We don't need to worry about state here as it's set to this next frame.
      inputRef.current.style.display = "inherit"
      inputRef.current.focus()
      inputRef.current.select()
    }
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
    <div {...props} ref={divRef} onDoubleClick={() => onDoubleClick()}>
      <input
        style={{display: editing?"inherit":"none" }} //We can't do conditional rendering as we need the ref
        ref={inputRef}
        type="text"
        value={text || ''} 
        onInput={e => onEditingInput(e.currentTarget.value)} 
        onBlur={() => setEditing(false)}
        onKeyUp={e => onEditingKeyUp(e.key)}
      />
      <p style={{display: editing?"none":"inherit" }}>{text}</p>
    </div>
  )
}