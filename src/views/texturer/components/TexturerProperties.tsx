import { useState } from 'react';
import Slider from 'react-input-slider';

type Swatch = {
    h: number,
    s: number,
    l: number,
}

const TexturerProperties = () => {

    const [hue, setHue] = useState(0)

    const [swatches, setSwatches] = useState<readonly Swatch[]>([])

    const addSwatch = (color: Swatch) => {
        const newSwatches = new Array<Swatch>()
        for (let i = 0; i < swatches.length; i++) {
            newSwatches.push(swatches[i])
        }
        newSwatches.push(color);
        setSwatches(newSwatches)
    }

    const removeSwatch = (swatch: Swatch) => {
        const newSwatches: Swatch[] = []
        for (let si = 0; si < swatches.length; si++) {
            if (swatches[si].h !== swatch.h || swatches[si].s !== swatch.s || swatches[si].l !== swatch.l) {
                newSwatches.push(swatches[si]);
            }
        }
        setSwatches(newSwatches)
    }

    return (
        <div className="rounded-sm bg-gray-900 h-full flex flex-row">
            <div className="ml-3 mr-3 my-2 pt-1">
                <HueSelector hue={hue} setHue={setHue} />
            </div>
            <div className="h-full flex flex-row w-full bg-gray-800">
                <div className="w-1/2">
                    <p className="bg-gray-900 h-4 w-full text-xs text-gray-300">COLOR SELECTOR</p>
                    <HSLColorBox resolution={25} height={25} hue={hue} swatches={swatches} addSw={addSwatch} removeSw={removeSwatch} />
                </div>
                <div className="w-1/2">
                    <p className="bg-gray-900 h-4 w-full text-xs text-gray-300">SWATCHES</p>
                    <div className="mx-2 my-1 h-full overflow-y-hidden w-min">
                        <SwatchesPannel swatches={swatches} setHue={setHue} removeSw={removeSwatch} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TexturerProperties;

const SwatchButton = ({ swatch, setHue, removeSw }: { swatch: Swatch, setHue: (hue: number) => void, removeSw: (swatch: Swatch) => void }) => {
    return (
        <div className="w-5 h-5 border border-black" style={{ backgroundColor: "hsl(" + swatch.h + ", " + swatch.s + "%, " + swatch.l + "%)" }} 
            onClick={() => setHue(swatch.h)}
            onDoubleClick={() => removeSw(swatch)}
        ></div>
    )
}

const SwatchesPannel = ({ swatches, setHue, removeSw }: { swatches: readonly Swatch[], setHue: (hue: number) => void, removeSw: (swatch: Swatch) => void }) => {

    return (
        <div className="grid grid-rows-5 grid-flow-col gap-1 overflow-x-scroll pb-4 pt-1 ">
            {swatches.map((swatch, i) => <SwatchButton key={i} swatch={swatch} setHue={setHue} removeSw={removeSw} />)}
            <div className="w-5 h-5 border border-black pl-1 hover:bg-gray-700 cursor-pointer"><p className="-mt-1">+</p></div>
        </div>
    )
}

const HueSelector = ({ hue, setHue }: { hue: number, setHue: any }) => {

    const [sliderHue, setSLiderHue] = useState(hue)

    function changeHue(newHue) {
        setSLiderHue(newHue);
        setHue(newHue * 3.6)
    }

    return (
        <Slider
            axis="y"
            y={sliderHue}
            onChange={({ y }) => changeHue(y)}
            styles={{
                track: { width: 6, background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)', height: '100%' },
                active: { background: 'transparent' },
                thumb: { width: 15, height: 15, opacity: '80%' }
            }}
        />

    )
}

const HSLColorBox = ({ resolution, height, hue, swatches, addSw, removeSw }: { resolution: number, height: number, hue: number, swatches: readonly Swatch[], addSw: (swatch: Swatch) => void, removeSw: (swatch: Swatch) => void }) => {

    //H values are determined by a seperate slider, so we will just store that in a prop

    //S values of hsl increase as the box does from 0 to 100 left to right
    const sValues: number[] = []
    for (let s = 0; s < resolution; s++) {
        sValues.push((100 / resolution) * s)
    }

    //L values are weird, TL: 100% TR: 50% Bottom: 0% so we need to interpolate horizontally the max
    //values then interpolate vertically between those max values and 0 (top to bottom)
    const lValues: number[][] = []
    for (let ly = 0; ly < height; ly++) {

        const topValue = 100 - ((50 / resolution) * ly)

        const colLValues: number[] = []

        for (let lx = 0; lx < resolution; lx++) {

            const value = topValue - ((topValue / height) * lx)
            colLValues.push(value)

        }

        lValues.push(colLValues)
    }

    function selected(swatch: Swatch) {
        for (let si = 0; si < swatches.length; si++) {
            if(swatches[si].h === swatch.h && swatches[si].s === swatch.s && swatches[si].l === swatch.l) {
                return true;
            }
        }
        return false;
    }

    return (
        <table className="w-full h-full">
            <tbody>{
                Array.from({ length: resolution }, (_, y) =>
                    <tr key={y}>{
                        Array.from({ length: resolution }, (_, x) => {
                            const boxVal: Swatch = { h: hue, s: sValues[x], l: lValues[x][y] }
                            return <ColorBox key={x} selected={selected(boxVal)} swatch={boxVal} addSw={addSw} removeSw={removeSw} />
                        })
                    }</tr>
                )
            }</tbody>
        </table>
    )
}

const ColorBox = ({ swatch, selected, addSw, removeSw }: { swatch: Swatch, selected: boolean, addSw: (swatch: Swatch) => void, removeSw: (swatch: Swatch) => void }) => {

    function toggleColor() {
        selected ? removeSw(swatch) : addSw(swatch)
    }

    return (
        <td className="w-1 p-0" style={{ height: "2%" }}>
            <div
                className={(!selected || "border " + (swatch.l < 20 ? "border-white" : "border-black")) + " h-full m-0 p-0"}
                style={{ backgroundColor: "hsl(" + swatch.h + ", " + swatch.s + "%, " + swatch.l + "%)" }}
                onClick={() => toggleColor()}
            ></div>
        </td>
    )
}