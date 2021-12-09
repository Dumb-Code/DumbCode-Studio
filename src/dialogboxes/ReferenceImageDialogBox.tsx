import ClickableInput from "../components/ClickableInput"
import { DblClickEditLO } from "../components/DoubleClickToEdit"
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
    <OpenedDialogBox width="800px" height="800px" title={Title}>
      <div className="flex flex-col h-full">
        <div className="flex flex-row w-full">
          <ClickableInput
            onFile={file => project.referenceImageHandler.uploadFile(file)}
            accept={imageExtensions}
            multiple
            description="Texture Files"
            tooltip="Upload Texture Files"
          >Upload</ClickableInput>
        </div>
        {images.map((image, i) => <ReferenceImageEntry key={i} image={image} />)}
      </div>
    </OpenedDialogBox >
  )
}

const ReferenceImageEntry = ({ image }: { image: ReferenceImage }) => {
  return (
    <div className="flex flex-row items-center dark:hover:bg-gray-600 hover:bg-gray-400">
      <img className="mr-2 border border-blue-500" width={100} src={image.img.src} alt="Reference" />
      <DblClickEditLO obj={image.name} className="flex-grow" inputClassName="w-full dark:text-black" />
      <input type="range" />
    </div>
  )
}

const Title = () => {
  return (
    <div className="text-2xl mb-5">Reference Images</div>
  )
}

export const _unsafe_OpenReferenceImage = () => _unsafe_setDialogBox(() => <ReferenceImageDialogBox />)

export default ReferenceImageDialogBox
