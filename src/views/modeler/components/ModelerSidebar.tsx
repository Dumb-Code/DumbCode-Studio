import ModelerCubeList from "./ModelerCubeList";
import ModelerProperties from "./ModelerProperties";

const ModelerSidebar = () => {
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