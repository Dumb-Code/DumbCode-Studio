import { useStudio } from "../../../contexts/StudioContext";
import { useListenableObject } from "../../../studio/util/ListenableObject";
import ModelerCubeList from "./ModelerCubeList";
import ModelerProperties from "./ModelerProperties";
import ModelerReferenceImageEdit from "./ModelerReferenceImageEdit";

const ModelerSidebar = () => {
    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()
    const [selectedReferenceImage] = useListenableObject(project.referenceImageHandler.selectedImage)

    if (selectedReferenceImage !== null) {
        return (
            <div className="h-full">
                <ModelerReferenceImageEdit image={selectedReferenceImage} model={project.model} />
            </div>
        )
    }

    return (
        <div className="flex flex-col-reverse h-full">
            <div>
                <ModelerProperties />
            </div>
            <div className="flex-grow min-h-0">
                <ModelerCubeList />
            </div>
        </div>
    )
}

export default ModelerSidebar;