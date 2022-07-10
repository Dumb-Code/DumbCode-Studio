import ClickableInput from "../../../components/ClickableInput"
import { SVGUpload } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import { ReadableFile } from "../../../studio/files/FileTypes"
import { BasicProjectFileArea } from "./ProjectFileArea"

const soundExtensions = [".wav", ".mp3"]

const ProjectSounds = () => {
  const { hasProject, getSelectedProject } = useStudio()

  const uploadFile = (file: ReadableFile) => {

  }

  return (
    <BasicProjectFileArea
      extensions={soundExtensions}
      onChange={uploadFile}
      title="Sounds"
      buttons={
        <ClickableInput
          onFile={uploadFile}
          accept={soundExtensions}
          multiple
          description="Sound Files"
          className="icon-button"
          tooltip="Upload Animation(s)"
        >
          <SVGUpload className="h-4 w-4 mr-1" />
        </ClickableInput>
      }
    >
      <div className="w-full h-full flex justify-center items-center dark:text-white">
        Sorry Ely
      </div>
    </BasicProjectFileArea>
  )
}

export default ProjectSounds