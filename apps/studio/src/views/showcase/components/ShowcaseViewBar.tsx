import { SVGCross, SVGPlus } from "@dumbcode/shared/icons"
import { useEffect, useRef } from "react"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { LO, useListenableObject } from "../../../studio/listenableobject/ListenableObject"

type TabType = {
    identifier: string,
    name: LO<string>
}
const ShowcaseViewBar = <T extends TabType,>({ all, selected, createNew }: {
    all: readonly T[],
    selected: LO<T | null>
    createNew: () => void
}) => {
    const [selectedObj, setSelected] = useListenableObject(selected)

    const ref = useRef<HTMLDivElement>(null)

    //We need to listen to `wheel` NOT passively, so we are unable to do `onScroll`
    useEffect(() => {
        const current = ref.current
        if (current) {
            const listener = (event: WheelEvent) => {
                event.preventDefault()
                event.stopPropagation()

                if (current !== null) {
                    current.scrollBy({ left: event.deltaY / 2.5 })
                }

            }
            current.addEventListener('wheel', listener, { passive: false })

            return () => current.removeEventListener('wheel', listener)
        }
    })


    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex">
            <div ref={ref} className="flex flex-row flex-wrap overflow-auto w-full">
                {all.map(a =>
                    <ViewTab key={a.identifier} animation={a} selected={a === selectedObj} onSelect={() => setSelected(a)} />
                )
                }
                <div onClick={e => { e.stopPropagation(); createNew() }} className="bg-green-500 px-1 hover:bg-green-600 h-6 flex-shrink-0 flex flex-row rounded m-1 cursor-pointer group">
                    <SVGPlus className="text-white group-hover:text-white h-4 w-4 mt-1" />
                </div>
            </div>
        </div>
    )
}

const ViewTab = ({ animation, selected, onSelect }: { animation: TabType, selected: boolean, onSelect: () => void }) => {
    return (
        <div onClick={e => { e.stopPropagation(); onSelect() }} className={(selected ? "bg-sky-500" : "dark:bg-gray-900 bg-gray-300 hover:bg-gray-400 dark:hover:bg-black truncate") + " flex-shrink-1 rounded m-1 cursor-pointer"}>
            <div className="flex flex-row">
                <DblClickEditLO obj={animation.name} className={(selected ? "text-white" : "dark:text-gray-400 text-black") + " flex-grow pl-1 pr-0.5 truncate"} inputClassName="p-0 w-24 h-full bg-white text-black border-none" />
                <button className="h-4 w-4 bg-gray-800 hover:bg-red-600 rounded pl-0.5 mt-1 mr-1 hover:text-white text-gray-400 opacity-30 hover:opacity-100"><SVGCross className="h-3 w-3 mr-0.5" /></button>
            </div>
            <div className="bg-black w-32 h-24 text-gray-700 pl-2">preview</div>
        </div>
    )
}

export default ShowcaseViewBar;