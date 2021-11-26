import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import { SVGLocked, SVGUnlocked } from './Icons';

const axis = [
    { axis: "x", color: "bg-red-500" },
    { axis: "y", color: "bg-green-500" },
    { axis: "z", color: "bg-sky-500" },
] as const

const CubeInput = ({ title, value, setValue, lock, lockPositive, onBlur, onFocus }: {
    title: string
    value?: readonly [number, number, number]
    setValue?: (value: readonly [number, number, number]) => void
    lock?: boolean,
    lockPositive?: boolean,
    onFocus?: () => void,
    onBlur?: () => void
}) => {

    const [isLocked, setLocked] = useState(lock)

    return (
        <div>
            <div className="flex flex-row">
                <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow">{title}</p>
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
                        lockPositive={lockPositive}
                        onBlur={onBlur}
                        onFocus={onFocus}
                    />
                )}
            </div>
        </div>
    )
}

const InputField = ({ axis, color, value, setValue, lockPositive, onFocus, onBlur }: {
    axis: string,
    color: string,
    value: number | null,
    setValue: (val: number) => void,
    lockPositive: boolean | undefined,
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
                format={val => val === null ? "" : parseFloat(String(val)).toFixed(2)}
                size={6}
                mobile={false}
                className="focus:outline-none focus:ring-gray-800 border-none"
                onChange={(val: number | null) => {
                    if (val !== null) {
                        (val < 0 && (lockPositive !== null && lockPositive === true)) ? setValue(0) : setValue(val)
                    }
                }}
                onBlur={onBlur}
                onFocus={onFocus}

            />
        </div>
    )
}

export default CubeInput;