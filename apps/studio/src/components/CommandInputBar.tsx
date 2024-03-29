import { SVGTerminal } from "@dumbcode/shared/icons";
import { MouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStudio } from "../contexts/StudioContext";
import { Command } from "../studio/command/Command";
import { CommandRoot, ParsedArgument } from "../studio/command/CommandRoot";
import { useListenableObjectNullable } from "../studio/listenableobject/ListenableObject";

const CommandInputBar = ({ command }: { command?: CommandRoot }) => {
  const { getSelectedProject, onFrameListeners } = useStudio()
  const project = getSelectedProject()

  const [focused, setFocused] = useState(false)
  const commandHistoryRef = useRef<HTMLDivElement>(null)

  const [input] = useListenableObjectNullable(command?.currentInput)
  const [activeCommand] = useListenableObjectNullable(command?.activeCommand)
  const [avaliableCommands] = useListenableObjectNullable(command?.avaliableCommands)
  const [currentFlags] = useListenableObjectNullable(command?.currentFlags)
  const [currentArgumentMap] = useListenableObjectNullable(command?.currentArgumentMap)
  const [logHistory] = useListenableObjectNullable(command?.logHistory)

  const [commandBuilder] = useListenableObjectNullable(command?.commandBuilder)
  const [commandBuilderError] = useListenableObjectNullable(commandBuilder?.commandBuilderError)
  const [commandBuilderText] = useListenableObjectNullable(commandBuilder?.commandBuilderText)
  const [commandBuilderValueText] = useListenableObjectNullable(commandBuilder?.commandBuilderValueText)

  const [lastCommandErrorOutput] = useListenableObjectNullable(command?.lastCommandErrorOutput)

  const [onFrameCallback] = useListenableObjectNullable(command?.onFrameCallback)
  const [onBuilderFrameCallback] = useListenableObjectNullable(commandBuilder?.onFrameCallback)

  const parsedArguments = currentArgumentMap ? Object.keys(currentArgumentMap) : []

  useEffect(() => {
    const listener = () => {
      if (!command) {
        return
      }
      if (command.commandBuilder.value) {
        command.commandBuilder.value.dummyRun()
      } else {
        command.onInputChanged()
      }
    }
    const selected = project.selectedCubeManager.selected
    selected.addPostListener(listener)
    return () => selected.removePostListener(listener)
  }, [project, command])

  useEffect(() => {
    const listener = () => {
      if (onFrameCallback) {
        onFrameCallback()
      }
      if (onBuilderFrameCallback) {
        onBuilderFrameCallback()
      }
    }
    onFrameListeners.add(listener)
    return () => { onFrameListeners.delete(listener) }
  }, [onFrameCallback, onBuilderFrameCallback, onFrameListeners])

  const shouldShowHistory = focused && logHistory && logHistory.length !== 0 && !!!commandBuilder && !!!activeCommand && (!!!avaliableCommands || avaliableCommands.length === 0)
  useLayoutEffect(() => {
    if (shouldShowHistory) {
      commandHistoryRef.current?.scrollBy({
        top: commandHistoryRef.current?.scrollHeight
      })
    }
  }, [shouldShowHistory, logHistory])

  return (
    <div className="has-tooltip">
      {/* Actual Command input region */}
      <div className=" relative rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex flex-row">
        <div className="w-8 dark:text-white text-black dark:border-r-2 dark:border-b dark:border-black">
          <SVGTerminal className="h-8 w-8 p-1" />
        </div>
        <input
          value={input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => command?.onKeyTyped(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              command?.runInput()
              e.preventDefault()
            } else if (e.key === "Escape") {
              command?.exitBuilder()
            }
            e.stopPropagation()
          }}
          type="text"
          className="text-xs dark:bg-gray-900 bg-gray-200 dark:text-gray-300 text-black border-none flex-grow focus:outline-none focus:ring-0"
          placeholder="type your command here"
        />
        <div className="text-red-500 absolute right-2 top-0 h-full text-xs flex items-center">
          {lastCommandErrorOutput}
        </div>
      </div>
      <div className="relative w-full inline-block z-10 transform translate-x-10 text-xs mt-1 dark:text-white text-black">


        {/* When typing a command, show all the possible options */}
        {!activeCommand && avaliableCommands?.map((com, i) =>
          <p key={i}>
            {com}
          </p>
        )}

        {/* When a command is chosen, show the arguments for that command */}
        {activeCommand && currentArgumentMap && currentFlags &&
          <>
            <p className="underline">command: {activeCommand.name}</p>
            <CommandFlags activeCommand={activeCommand} parsedFlags={currentFlags} />
            <CommandArguments activeCommand={activeCommand} parsedArguments={parsedArguments} currentArgumentMap={currentArgumentMap} />
          </>}

        {/* When a command builder is chosen, show the data for that */}
        {commandBuilder &&
          <>
            <p>{commandBuilderText}</p>
            <p>{commandBuilderValueText}</p>
            <p className="text-red-500 font-bold">{commandBuilderError}</p>
          </>
        }

        {/* Command feedback history */}
        {focused && logHistory && logHistory.length !== 0 && !!!commandBuilder && !!!activeCommand && (!!!avaliableCommands || avaliableCommands.length === 0) &&
          <div ref={commandHistoryRef} className="max-h-32 p-1 bg-black bg-opacity-25 studio-scrollbar w-[calc(100%-3rem)] overflow-x-hidden overflow-y-auto">
            {logHistory.map((d, i) => {
              let className = ""
              if (d.type === "command") {
                className = "underline cursor-pointer"
                if (i !== 0) {
                  className = "underline cursor-pointer mt-2"
                }
              }
              if (d.type === "error") {
                className = "text-red-500"
              }

              const onClick = (e: MouseEvent) => {
                if (d.type === "command") {
                  command?.runCommand(d.message, false)
                  e.preventDefault()
                }
              }

              return (
                <p key={i} onMouseDown={onClick} className={className}>{d.message} {d.times !== undefined && ` x ${d.times}`}</p>
              )
            })}
          </div>
        }
      </div>
    </div>
  )
}

const CommandFlags = ({ activeCommand, parsedFlags }: { activeCommand: Command, parsedFlags: readonly string[] }) => {
  const flags = activeCommand.formatFlags()
  if (flags.length === 0) {
    return null
  }
  return (
    <>
      <p>Command Flags</p>
      <div className="ml-2">
        {flags.map((f, i) => <p key={i} className={parsedFlags.includes(f.name) ? "font-bold" : ""}>-{f.name}: {f.desc}</p>)}
      </div>
    </>
  )
}

const CommandArguments = ({ activeCommand, currentArgumentMap, parsedArguments }: { activeCommand: Command, currentArgumentMap: Record<string, ParsedArgument<any>>, parsedArguments: readonly string[] }) => {
  const args = activeCommand.formatArguments()
  if (args.length === 0) {
    return null
  }

  return (
    <>
      <p>Command Arguments</p>
      <div className="ml-2">
        {args.map((arg, i) => {
          const parseData = currentArgumentMap[arg.name]
          const isParsed = parsedArguments.includes(arg.name)

          let className = ""
          if (!parseData || parseData.error !== undefined) {
            className = "font-bold text-red-500"
          } else if (isParsed) {
            className = "text-green-500"
          }

          return (
            <p key={i}>
              {arg.name}: {
                typeof arg.desc === "function" ?
                  <arg.desc
                    errorData={parseData?.error?.errorData}
                    isParsed={parseData !== undefined && parseData.error === undefined && isParsed}
                  /> : <span className={className}>{arg.desc}</span>}
              {" "}{(parseData?.textfreindlyValue ?? undefined) !== undefined && `(${parseData.textfreindlyValue})`}
              {" "}<span className="text-red-500">{parseData?.error !== undefined && String(parseData?.error)}</span>
            </p>
          )
        })}
      </div>
    </>
  )
}

export default CommandInputBar;