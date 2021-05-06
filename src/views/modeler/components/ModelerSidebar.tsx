import ModelerCubeList from "./ModelerCubeList";
import ModelerProperties from "./ModelerProperties";

const ModelerSidebar = () => {
    return(
        <div className="flex flex-col h-full">
            <div className="flex-grow min-h-0">
                <ModelerCubeList />
            </div>
            <ModelerProperties />
        </div>
    )
}

export default ModelerSidebar;