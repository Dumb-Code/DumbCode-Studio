import { DetailedHTMLProps, HTMLAttributes, useRef, useState } from "react";
import { LO, useListenableObject } from "../studio/util/ListenableObject";

type DivExtended = {
  className?: string,
  inputClassName?: string,
  props?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
}
const DblClickEditInternal = ({ callback, text, className, inputClassName, props }:
  {
    callback: (str: string) => void,
    text: string,
  } & DivExtended
) => {
  const [editing, setEditing] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDoubleClick = () => {
    setEditing(true)
    if (inputRef.current !== null) {
      //For some reason the display can't be NONE to display it.
      //We don't need to worry about state here as it's set to this next frame.
      inputRef.current.style.display = "inherit"
      inputRef.current.focus()
      inputRef.current.select()
    }
  }

  const onEditingInput = (str: string) => {
    callback(str)
  }

  const onEditingKeyUp = (key: string) => {
    if (key === "Enter") {
      setEditing(false)
    }
  }


  return (
    <div {...props} className={className} ref={divRef} onDoubleClick={() => onDoubleClick()}>
      <input
        style={{ display: editing ? "inherit" : "none" }} //We can't do conditional rendering as we need the ref
        className={inputClassName}
        ref={inputRef}
        type="text"
        value={text}
        onInput={e => onEditingInput(e.currentTarget.value)}
        onBlur={() => setEditing(false)}
        onKeyUp={e => onEditingKeyUp(e.key)}
      />
      {editing || text}
    </div>
  )
}
export const DoubleClickToEdit = ({ callback, current, className, inputClassName, props }:
  {
    callback: (str: string) => void,
    current?: string,
  } & DivExtended
) => {
  const [text, setText] = useState(current ?? '')
  return <DblClickEditInternal text={text} callback={t => { setText(t); callback(t); }} className={className} inputClassName={inputClassName} props={props} />
}

export const DblClickEditLO = ({ obj, className, inputClassName, props }:
  {
    obj: LO<string>
  } & DivExtended
) => {
  const [text, setText] = useListenableObject(obj)
  return <DblClickEditInternal text={text} callback={setText} className={className} inputClassName={inputClassName} props={props} />
}