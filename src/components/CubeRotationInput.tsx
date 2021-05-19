import Slider from 'react-input-slider'
import NumericInput from 'react-numeric-input';

const axis = [
    { axis: "x", color: "red" },
    { axis: "y", color: "green" },
    { axis: "z", color: "lightBlue" },
] as const

const CubeRotationInput = ({ title, value, setValue }: {
    title: string
    value?: readonly [number, number, number]
    setValue?: (value: readonly [number, number, number]) => void
}) => {
    return (
        <div>
            <p className="ml-1 text-gray-400 text-xs">{title}</p>
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

const mod = (n: number, m: number) => {
    return ((n % m) + m) % m;
}

const InputField = ({ axis, color, value, setValue }: {
    axis: string,
    color: string,
    value: number | null,
    setValue: (val: number) => void
}) => {
    if (value !== null && Math.abs(value) > 180) {
        value = (mod(value + 180, 360)) - 180
    }
    return (
        <div className="flex flex-row mb-2 h-7 col-span-2">
            <div className={`bg-${color}-500 rounded-l px-2 text-white font-bold border-gray-900 pt-2 text-xs h-8`}>
                {axis.toUpperCase()}
            </div>
            <div className=" w-20 h-7">
                <NumericInput value={value?.toFixed(2) ?? ""} size={2} mobile={false} className="focus:outline-none focus:ring-gray-800 border-none" />
            </div>
            <div className="rounded-r bg-gray-700 flex-grow pr-4 pl-2 h-8">
                <Slider
                    xmin={-180}
                    xmax={180}
                    disabled={value === null}
                    axis="x"
                    styles={{
                        track: { height: 6, backgroundColor: '#27272A', width: '100%' },
                        active: { backgroundColor: '#0EA5E9' },
                        thumb: { width: 15, height: 15 }
                    }}
                    x={value ?? 0}
                    onChange={({ x }) => setValue(x)}
                />
            </div>
        </div>
    )
}

export default CubeRotationInput;