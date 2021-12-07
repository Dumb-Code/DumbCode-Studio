import ModelerCubeList from "./ModelerCubeList";
import ModelerProperties from "./ModelerProperties";

const ModelerSidebar = () => {
    // const { getSelectedProject } = useStudio()
    // const project = getSelectedProject()
    // const [opened] = useListenableObject(project.referenceImageHandler.opened)

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