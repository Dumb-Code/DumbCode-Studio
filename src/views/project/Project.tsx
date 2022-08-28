import { useRef } from 'react'
import { useWhenAction } from '../../containers/StudioContainer'
import { useProjectPageContext } from '../../contexts/ProjectPageContext'
import StudioGridRaw from '../../studio/griddividers/components/StudioGrid'
import StudioGridArea from '../../studio/griddividers/components/StudioGridArea'
import DividerArea from '../../studio/griddividers/DividerArea'
import GridArea from '../../studio/griddividers/GridArea'
import GridSchema from '../../studio/griddividers/GridSchema'
import { useAnimationHook } from '../../studio/util/AnimationHooks'
import ProjectAnimations from './components/ProjectAnimations'
import ProjectModels from './components/ProjectModels'
import ProjectRemote from './components/ProjectRemote'
import ProjectSounds from './components/ProjectSounds'
import ProjectTextures from './components/ProjectTextures'


const model = GridArea.area("model")
const animation = GridArea.area("animation")
const texture = GridArea.area("texture")
const sounds = GridArea.area("sounds")
const remote = GridArea.area("remote")

const schema = GridSchema.createSchema(
    GridArea.join(
        [model, animation, texture],
        [model, sounds, texture],
        [remote, remote, texture]
    ),
    DividerArea.from(
        ['30%', '30%', '40%'],
        ['auto', 'auto', 44]
    )
)

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

const Project = () => {

    const { remoteSettingsOpen, setRemoteSettingsOpen } = useProjectPageContext()

    const gridRef = useRef<HTMLDivElement>(null)
    const divHeightRef = useRef<HTMLDivElement>(null)

    const override = useAnimationHook(remoteSettingsOpen, percentRaw => {
        //Apply easing function to percentRaw
        const percent = easeInOutCubic(percentRaw)
        if (gridRef.current !== null) {
            gridRef.current.style.gridTemplateRows = `auto auto ${44 + (237 - 44) * percent}px`
        }

        if (divHeightRef.current !== null) {
            divHeightRef.current.style.height = `${0 + (12 - 0) * percent}rem`
        }
    })

    useWhenAction("last_remote_repo_project", () => {
        setRemoteSettingsOpen(true)
        override(true)
    })


    return (
        <StudioGridRaw
            ref={gridRef}
            schema={schema}
            className="mx-2 bg-white dark:bg-black transition-grid-template-rows ease-in-out duration-200"
        >

            <StudioGridArea className='p-2' area={remote}>
                <ProjectRemote divHeightRef={divHeightRef} />
            </StudioGridArea>

            <StudioGridArea className='p-2' area={model}>
                <ProjectModels />
            </StudioGridArea>

            <StudioGridArea className='p-2' area={texture}>
                <ProjectTextures />
            </StudioGridArea>

            <StudioGridArea className='p-2' area={animation}>
                <ProjectAnimations />
            </StudioGridArea>

            <StudioGridArea className='p-2' area={sounds}>
                <ProjectSounds />
            </StudioGridArea>

        </StudioGridRaw>
    )
}

export default Project;