import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const ConfirmActionDialogBox = ({ title, description, yes = "Yes", no = "No", onYes, onNo }: {
  title: string,
  description: string,
  yes?: string,
  no?: string,
  onYes?: () => void
  onNo?: () => void
}) => {
  const { clear } = useOpenedDialogBoxes()

  const runThenClose = (callback?: () => void) => () => {
    callback?.()
    clear()
  }

  return (
    <OpenedDialogBox width="400px" height="200px" title={title}>
      <div className="flex flex-col justify-center h-full p-5">
        <div className="text-center flex-grow dark:text-white font-semibold">{description}</div>
        <div className="flex flex-row">
          <div className="flex-1 text-center">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={runThenClose(onYes)}>{yes}</button>
          </div>
          <div className="flex-1 text-center">
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={runThenClose(onNo)}>{no}</button>
          </div>
        </div>
      </div>
    </OpenedDialogBox >
  )
}

export default ConfirmActionDialogBox
