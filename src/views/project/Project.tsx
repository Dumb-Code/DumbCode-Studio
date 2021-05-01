import ProjectChangelog from './components/ProjectChangelog'
import ProjectModels from './components/ProjectModels'
import ProjectRemote from './components/ProjectRemote'
import ProjectAnimations from './components/ProjectAnimations'
import ProjectTextures from './components/ProjectTextures'

const Texturer = () => {
    return (
        <div className="h-full grid grid-areas-project"
            style={{
                gridTemplateColumns: '20% auto auto',
                gridTemplateRows: '20% 30% 50%'
            }}
        >
            <div className="grid-in-changelog border border-black"><ProjectChangelog /></div>
            <div className="grid-in-remote border border-black"><ProjectRemote /></div>
            <div className="grid-in-model border border-black"><ProjectModels /></div>
            <div className="grid-in-texture border border-black"><ProjectAnimations /></div>
            <div className="grid-in-animation border border-black"><ProjectTextures /></div>
        </div>
    )
}

export default Texturer;