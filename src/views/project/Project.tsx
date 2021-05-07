import ProjectModels from './components/ProjectModels'
import ProjectRemote from './components/ProjectRemote'
import ProjectAnimations from './components/ProjectAnimations'
import ProjectTextures from './components/ProjectTextures'

const Texturer = () => {
    return (
        <div className="h-full grid grid-areas-project overflow-hidden mx-2 bg-black"
            style={{
                gridTemplateColumns: '30% 30% 40%',
                gridTemplateRows: 'auto min-content'
            }} 
        >
            <div className="p-2 bg-black grid-in-remote"><ProjectRemote /></div>
            <div className="p-2 bg-black grid-in-model"><ProjectModels /></div>
            <div className="p-2 bg-black grid-in-texture"><ProjectTextures /></div>
            <div className="p-2 bg-black grid-in-animation"><ProjectAnimations /></div>
        </div>
    )
}

export default Texturer;