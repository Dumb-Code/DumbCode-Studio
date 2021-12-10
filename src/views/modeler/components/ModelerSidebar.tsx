import HistoryList from "../../../components/HistoryList";
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
        <div className="h-full overflow-y-scroll studio-scrollbar">
            <div className="min-h-96">
                <ModelerCubeList />
            </div>
            <ModelerProperties />
            <HistoryList />
        </div>
    )
}

export default ModelerSidebar;