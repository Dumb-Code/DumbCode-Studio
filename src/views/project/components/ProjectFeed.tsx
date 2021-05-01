import { useState } from 'react';

const ProjectFeed = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2">
                <p className="flex-grow">FEED</p>
            </div>
            <div className="border-r border-black flex flex-col overflow-y-scroll h-full w-full pr-6">
                <FeedItem name="Announcing v1.0.0" content="Some test content for this announcement or something idk" />
                <FeedItem name="Kash's Mom Still Fat!" content="She really do be fat tho" />
            </div>
        </div>
    )
}

const FeedItem = ({name, content}: {name: string, content: string}) => {

    const [active, setActiveState] = useState(false);

    function toggleShown() {
        setActiveState(!active);
    }

    return(
        <div className="bg-gray-700 rounded my-1 w-full ml-2">
            <button className="bg-gray-700 w-full text-left flex flex-row rounded" onClick={toggleShown}>
                <p className="flex-grow m-2 font-bold">{name}</p>
                <p className={(active ? "rotate-90" : "") + " font-bold transform mr-4"}>&#x3e;</p>
            </button>
            <p className={(active ? "" : "hidden") + " bg-gray-600 p-2"}>{content}</p>
        </div>
    )

}

export default ProjectFeed;