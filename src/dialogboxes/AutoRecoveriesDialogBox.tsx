import { useCallback, useMemo } from "react"
import { useStudio } from "../contexts/StudioContext"
import { useAllEntries as useAllRecoveryEntries } from "../studio/autorecovery/AutoRecoveryFileSystem"
import { loadDcProj } from "../studio/formats/project/DcProjectLoader"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const AutoRecoveriesDialogBox = () => {

  const [entries] = useAllRecoveryEntries()

  return (
    <OpenedDialogBox width="600px" height="600px" title="Auto Recoveries">
      <div className="flex flex-col justify-center h-full p-5">
        <div className="text-center dark:text-white font-semibold">Select an auto recovery to add load it</div>
        <div className="flex-grow h-0 overflow-x-hidden overflow-y-auto studio-scrollbar flex flex-col bg-gray-200 dark:bg-gray-700 m-3">
          {entries.reverse().map((e, i) => <AutoRecoveryEntry key={i} entry={e} />)}
        </div>
      </div>
    </OpenedDialogBox >
  )
}


const AutoRecoveryEntry = ({ entry }: { entry: FileSystemFileEntry }) => {
  const [timeStr, ...restOfFileNameArr] = entry.name.split("-")
  const projectName = restOfFileNameArr.join("-")

  const timeSince = useMemo(() => getTimeSince(new Date(parseInt(timeStr))), [timeStr])

  const { clear } = useOpenedDialogBoxes()
  const { addProject, setSettingsOpen } = useStudio()

  const onClick = useCallback(async () => {
    const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject))
    const project = await loadDcProj(`${projectName}-autorecovery`, await file.arrayBuffer())
    clear()
    setSettingsOpen(false)
    addProject(project)
  }, [addProject, clear, entry, projectName, setSettingsOpen])


  return (
    <div onClick={onClick} className="flex flex-row p-2 border hover:bg-blue-500 cursor-pointer">
      <span className="flex-grow">{projectName}</span>
      <span className="text-gray-500">{timeSince} ago</span>
    </div>
  )
}

function floorAndAddS(interval: number, suffix: string) {
  const floor = Math.floor(interval)
  return `${floor} ${suffix}${floor === 1 ? "" : "s"}`
}

//A function that converts a date object to a human readable time ago
function getTimeSince(date: Date) {

  var seconds = Math.floor((Date.now() - date.getTime()) / 1000);


  var interval = seconds / 31536000;

  if (interval > 1) {
    return floorAndAddS(interval, "year")
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return floorAndAddS(interval, "month")
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return floorAndAddS(interval, "day")
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return floorAndAddS(interval, "hour")
  }
  interval = seconds / 60;
  if (interval > 1) {
    return floorAndAddS(interval, "minute")
  }
  return floorAndAddS(seconds, "second")
}

export default AutoRecoveriesDialogBox