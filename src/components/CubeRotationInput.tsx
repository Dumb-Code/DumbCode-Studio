import Slider from 'react-input-slider';
import { NumArray } from '../studio/util/NumArray';
import NumericInput from './NumericInput';

const axis = [
  { axis: "x", color: "bg-red-500" },
  { axis: "y", color: "bg-green-500" },
  { axis: "z", color: "bg-sky-500" },
] as const

const CubeRotationInput = ({ title, value, setValue, onFocus, onBlur }: {
  title: string
  value?: NumArray
  setValue?: (value: NumArray) => void,
  onFocus?: () => void,
  onBlur?: () => void
}) => {
  return (
    <div>
      <p className="ml-1 dark:text-gray-400 text-black text-xs">{title}</p>
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
            onBlur={onBlur}
            onFocus={onFocus}
          />
        )}
      </div>
    </div>
  )
}

const mod = (n: number, m: number) => {
  return ((n % m) + m) % m;
}

const InputField = ({ axis, color, value, setValue, onFocus, onBlur }: {
  axis: string,
  color: string,
  value: number | null,
  setValue: (val: number) => void,
  onFocus?: () => void,
  onBlur?: () => void
}) => {
  let sliderValue = value
  if (value !== null && Math.abs(value) > 180) {
    sliderValue = (mod(value + 180, 360)) - 180
  }
  return (
    <div className="flex flex-row mb-2 h-7 col-span-2">
      <div className={`${color} rounded-l px-2 text-white font-bold border-gray-900 pt-2 text-xs h-8`}>
        {axis.toUpperCase()}
      </div>
      <div className=" w-20 h-7">
        <NumericInput
          value={value ?? undefined}
          onChange={setValue}
          startBatchActions={onFocus}
          endBatchActions={onBlur}
        />
      </div>
      <div className="rounded-r dark:bg-gray-700 bg-gray-300 flex-grow pr-4 pl-2 h-8">
        <Slider
          xmin={-180}
          xmax={180}
          disabled={sliderValue === null}
          axis="x"
          styles={{
            track: { height: 6, backgroundColor: '#27272A', width: '100%' },
            active: { backgroundColor: '#0EA5E9' },
            thumb: { width: 15, height: 15 }
          }}
          x={sliderValue ?? 0}
          onChange={({ x }) => setValue(x)}

          onDragStart={onFocus}
          onDragEnd={onBlur}
        />
      </div>
    </div>
  )
}

export default CubeRotationInput;