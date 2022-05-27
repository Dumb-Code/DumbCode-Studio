import ClickableInput from "../components/ClickableInput"
import { DblClickEditLO } from "../components/DoubleClickToEdit"
import { SVGTrash, SVGUpload } from "../components/Icons"
import Toggle from "../components/Toggle"
import { useStudio } from "../contexts/StudioContext"
import { useListenableObject } from "../studio/util/ListenableObject"
import { ReferenceImage } from "../studio/util/ReferenceImageHandler"
import { OpenedDialogBox, _unsafe_setDialogBox } from "./DialogBoxes"

const imageExtensions = [".png", ".jpeg", ".gif"]

const ReferenceImageDialogBox = () => {
  // const dialogBox = useOpenedDialogBoxes()
  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()

  const [images] = useListenableObject(project.referenceImageHandler.images)

  return (
    <OpenedDialogBox width="800px" height="800px" title="Reference Images">
      <div className="flex flex-col">
        <div className="flex flex-row w-full border-b border-gray-300 dark:border-0 bg-white dark:bg-gray-900 dark:bg-opacity-75">
          <ClickableInput
            className="bg-green-500 hover:bg-green-600 rounded-md w-auto p-1 flex flex-row text-xs m-2 px-2 text-white dark:text-black"
            onFile={file => project.referenceImageHandler.uploadFile(file)}
            accept={imageExtensions}
            multiple
            description="Texture Files"
            tooltip="Upload Texture Files"
          ><SVGUpload className="h-4 w-4 mr-2" />UPLOAD NEW REFERENCE IMAGE</ClickableInput>
        </div>
        {images.map((image, i) => <ReferenceImageEntry key={i} image={image} />)}
      </div>
    </OpenedDialogBox >
  )
}

const ReferenceImageEntry = ({ image }: { image: ReferenceImage }) => {
  const [canSelect, setCanSelect] = useListenableObject(image.canSelect)
  const [isHidden, setHidden] = useListenableObject(image.hidden)
  return (
    <div className="flex flex-row items-center border-b border-r border-gray-300 dark:border-gray-900">
      <img className="mr-2" width={100} src={image.img.src} alt="Reference" />
      <div className="mr-4 mt-2 flex-grow pb-1">
        <p className="ml-1 dark:text-gray-400 text-black text-xs mb-1">IMAGE NAME</p>
        <DblClickEditLO obj={image.name} className="flex-grow mb-1" inputClassName="w-full dark:text-black" />
      </div>
      <div className="mr-4 mt-2 mb-2">
        <p className="ml-1 dark:text-gray-400 text-black text-xs mb-2">SELECTABLE</p>
        <div className="flex flex-row w-12">
          <Toggle checked={canSelect} setChecked={setCanSelect} />
          <p className="text-xs pt-0.5 ml-2 dark:text-gray-400 text-black">{canSelect ? "Yes" : "No"}</p>
        </div>
      </div>
      <div className="mr-4 mt-2 mb-2">
        <p className="ml-1 dark:text-gray-400 text-black text-xs mb-2">HIDDEN</p>
        <div className="flex flex-row w-12">
          <Toggle checked={isHidden} setChecked={setHidden} />
          <p className="text-xs pt-0.5 ml-2 dark:text-gray-400 text-black">{isHidden ? "Yes" : "No"}</p>
        </div>
      </div>
      <div className="mr-4 mt-2 mb-2 ml-4">
        <p className="ml-1 dark:text-gray-400 text-black text-xs mb-1">DELETE</p>
        <div className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-md" onClick={() => image.delete()}>
          <SVGTrash className="w-4 h-4 ml-2" />
        </div>
      </div>
    </div>
  )
}

export const _unsafe_OpenReferenceImage = () => _unsafe_setDialogBox(() => <ReferenceImageDialogBox />)

export default ReferenceImageDialogBox
