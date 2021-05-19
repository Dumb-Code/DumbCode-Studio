import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import { SVGLocked, SVGUnlocked } from './Icons';

const axis = [
    { axis: "x", color: "bg-red-500" },
    { axis: "y", color: "bg-green-500" },
    { axis: "z", color: "bg-lightBlue-500" },
] as const

const CubeInput = ({ title, value, setValue, lock }: {
    title: string
    value?: readonly [number, number, number]
    setValue?: (value: readonly [number, number, number]) => void
    lock?: boolean
}) => {

    const[isLocked, setLocked] = useState(lock)

    return (
        <div>
            <div className="flex flex-row">
                <p className="ml-1 text-gray-400 text-xs flex-grow">{title}</p>
                {lock === undefined || 
                    <button className={(isLocked ? "bg-red-600" : "bg-gray-900") + " text-xs rounded mr-1 h-4 w-4 p-0.5 text-white"} onClick={() => setLocked(!isLocked)}>
                        {isLocked ? <SVGLocked /> : <SVGUnlocked />}
                    </button>
                }
            </div>
            <div className="flex flex-col p-1">
                {axis.map((a, idx) =>
                    <InputField
                        {...a}
                        key={a.axis}
                        value={value ? value[idx] : null}
                        setValue={v => {
                            if (setValue && value) {
                                setValue([
                                    idx === 0 ? v : value[0],
                                    idx === 1 ? v : value[1],
                                    idx === 2 ? v : value[2]
                                ])
                            }
                        }}
                    />
                )}
            </div>
        </div>
    )
}

const InputField = ({ axis, color, value, setValue }: {
    axis: string,
    color: string,
    value: number|null,
    setValue: (val: number) => void
}) => {
    return (
        <div className="flex flex-row mb-1 h-7">
            <div className={`${color} rounded-l px-2 text-white font-bold border-gray-900 pt-1.5 text-xs`}>
                {axis.toUpperCase()}
            </div>

            <NumericInput
                value={value?.toFixed(2) ?? ""}
                size={6}
                mobile={false}
                className="focus:outline-none focus:ring-gray-800 border-none"
                onChange={(val: number | null) => {
                    if (val !== null) {
                        setValue(val)
                    }
                }}
            />
        </div>
    )
}

export default CubeInput;