import { OpenedDialogBox } from "./DialogBoxes";

//::TODO
const RemoteProjectsDialogBox = () => {
  return (
    <OpenedDialogBox width="800px" height="800px" title="Load a Repository">
      <div className="flex flex-col h-full">
        Here We Add a way to projects to the .studio_remote.json
      </div>
    </OpenedDialogBox>
  )
}

export default RemoteProjectsDialogBox;