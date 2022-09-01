import { useState } from 'react';
import { NumArray } from '../studio/util/NumArray';
import { SVGLocked, SVGUnlocked } from './Icons';
import NumericInput from './NumericInput';

const axis = [
    { axis: "x", color: "bg-red-500" },
    { axis: "y", color: "bg-green-500" },
    { axis: "z", color: "bg-sky-500" },
] as const

const CubeInput = ({ title, value, setValue, lock, positiveInteger, onBlur, onFocus }: {
    title: string
    value?: NumArray
    setValue?: (value: NumArray) => void
    lock?: boolean,
    positiveInteger?: boolean,
    onFocus?: () => void,
    onBlur?: () => void
}) => {

    const [isLocked, setLocked] = useState(lock)

    return (
        <div className="flex-grow">
            <div className="flex flex-row">
                <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">{title}</p>
                {lock === undefined ||
                    <button className={(isLocked ? "bg-red-600" : "dark:bg-gray-900 bg-white") + " text-xs rounded mr-1 h-4 w-4 p-0.5 text-white"} onClick={() => setLocked(!isLocked)}>
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
                        positiveInteger={positiveInteger}
                        onBlur={onBlur}
                        onFocus={onFocus}
                    />
                )}
            </div>
        </div>
    )
}

const InputField = ({ axis, color, value, setValue, positiveInteger, onFocus, onBlur }: {
    axis: string,
    color: string,
    value: number | null,
    setValue: (val: number) => void,
    positiveInteger: boolean | undefined,
    onFocus?: () => void,
    onBlur?: () => void
}) => {
    return (
        <div className="flex flex-row mb-1 h-7">
            <div className={`${color} rounded-l px-2 text-white font-bold border-gray-900 pt-1.5 text-xs`}>
                {axis.toUpperCase()}
            </div>

            <NumericInput
                value={value ?? undefined}
                onChange={setValue}
                isPositiveInteger={positiveInteger}
                startBatchActions={onFocus}
                endBatchActions={onBlur}
                defaultValue={positiveInteger ? 1 : 0}
            />
        </div>
    )
}

export default CubeInput;