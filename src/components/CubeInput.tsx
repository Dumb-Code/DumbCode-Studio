import NumericInput from 'react-numeric-input';

const axis = [
    { axis: "x", color: "red" },
    { axis: "y", color: "green" },
    { axis: "z", color: "lightBlue" },
] as const

const CubeInput = ({ title, value, setValue }: {
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
            <div className={`bg-${color}-500 rounded-l px-2 text-white font-bold border-gray-900 pt-1.5 text-xs`}>
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