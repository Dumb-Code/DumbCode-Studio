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

    const removeSwatch = (color: Swatch) => {
        const newSwatches: Swatch[] = []
        for (let i = 0; i < swatches.length; i++) {
            if (swatches[i] !== color) {
                newSwatches.push(swatches[i]);
            }
        }
    }

    return (
        <div className="rounded-sm bg-gray-800 h-full flex flex-row">
            <HSLColorBox resolution={25} height={25} hue={hue} addSw={addSwatch} removeSw={removeSwatch} />
            <HueSelector hue={hue} setHue={setHue} />
            <div className="mx-2 my-1 h-full overflow-y-hidden">
                <SwatchesPannel swatches={swatches} />
            </div>
        </div>
    )
}

export default TexturerProperties;

const SwatchButton = ({ swatch }: { swatch: Swatch }) => {
    return (
        <div className="w-5 h-5" style={{ backgroundColor: "hsl(" + swatch.h + ", " + swatch.s + "%, " + swatch.l + "%)" }}></div>
    )
}

const SwatchesPannel = ({ swatches }: { swatches: readonly Swatch[] }) => {

    return (
        <div className="grid grid-rows-6 grid-flow-col gap-1">
            {swatches.map((swatch, i) => <SwatchButton key={i} swatch={swatch} />)}
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
                thumb: { width: 15, height: 15 }
            }}
        />

    )
}

const HSLColorBox = ({ resolution, height, hue, addSw, removeSw }: { resolution: number, height: number, hue: number, addSw: (swatch: Swatch) => void, removeSw: (swatch: Swatch) => void }) => {

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

    return (
        <table className="w-1/2 h-full">
            <tbody>{
                Array(resolution).map((_, y) =>
                    <tr key={y}>{
                        Array(height).map((_, x) => {
                            const boxVal: Swatch = { h: hue, s: sValues[x], l: lValues[x][y] }
                            return <ColorBox key={x} swatch={boxVal} addSw={addSw} removeSw={removeSw} />
                        })
                    }</tr>
                )
            }</tbody>
        </table>
    )
}

const ColorBox = ({ swatch, addSw, removeSw }: { swatch: Swatch, addSw: (swatch: Swatch) => void, removeSw: (swatch: Swatch) => void }) => {

    const [selected, setSelected] = useState(false);

    function toggleColor() {
        setSelected(!selected)
        selected ? removeSw(swatch) : addSw(swatch)
    }

    return (
        <td className="w-1 p-0" style={{ height: "2%" }}>
            <div
                className={(!selected || "border-2 border-black") + " h-full m-0 p-0"}
                style={{ backgroundColor: "hsl(" + swatch.h + ", " + swatch.s + "%, " + swatch.l + "%)" }}
                onClick={() => toggleColor()}
            ></div>
        </td>
    )
}