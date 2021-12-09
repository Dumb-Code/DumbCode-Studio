import { DetailedHTMLProps, HTMLAttributes, useRef, useState } from "react";
import { LO, useListenableObject } from "../studio/util/ListenableObject";

type DivExtended = {
  className?: string,
  disabled?: boolean,
  inputClassName?: string,
  props?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
  onStartEditing?: () => void,
  onFinishEditing?: () => void,
}

const DblClickEditInternal = ({ callback, text, className, inputClassName, disabled, props, onStartEditing, onFinishEditing }:
  {
    callback: (str: string) => void,
    text: string,
  } & DivExtended
) => {
  const [editing, setEditing] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doStart = () => {
    setEditing(true)
    onStartEditing?.()
  }

  const doStop = () => {
    setEditing(false)
    onFinishEditing?.()
  }

  const onDoubleClick = () => {
    if (disabled) {
      return
    }
    doStart()
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
      doStop()
    }
  }

  const openEdit = editing && !disabled

  return (
    <div
      {...props}
      className={className}
      ref={divRef}
    >
      <input
        style={{ display: openEdit ? "inherit" : "none" }} //We can't do conditional rendering as we need the ref
        className={inputClassName}
        ref={inputRef}
        type="text"
        value={text}
        onInput={e => onEditingInput(e.currentTarget.value)}
        onBlur={doStop}
        onKeyUp={e => onEditingKeyUp(e.key)}
        onClick={e => e.stopPropagation()}
      />
      {
        openEdit ||
        <span
          // onClick={e => e.stopPropagation()}
          onDoubleClick={e => {
            onDoubleClick()
            e.stopPropagation()
          }}
        >
          {text}
        </span>}
    </div>
  )
}
export const DoubleClickToEdit = (props:
  {
    callback: (str: string) => void,
    current?: string,
  } & DivExtended
) => {
  const [text, setText] = useState(props.current ?? '')
  return <DblClickEditInternal {...props} text={text} callback={t => { setText(t); props.callback(t); }} />
}

export const DblClickEditLO = (props:
  {
    obj: LO<string>
  } & DivExtended
) => {
  const [text, setText] = useListenableObject(props.obj, [props])
  return <DblClickEditInternal {...props} text={text} callback={setText} />
}