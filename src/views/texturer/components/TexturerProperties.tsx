import PropTypes from 'prop-types';
import { useState } from 'react';

const TexturerProperties = () => {

    const[hue, setHue] = useState(0)

    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-row">
            <HSLColorBox resolution={25} height={25} hue={hue} />
            <HueSelector hue={hue} setHue={setHue} />
        </div>
    )
}

export default TexturerProperties;

const HueSelector = ({hue, setHue}: {hue: number, setHue: any}) => {
    return(
        <div className="h-full w-8" style={{background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'}} onClick={() => {setHue(Math.random() * 360)}}>
            test
        </div>
    )
}

const HSLColorBox = ({resolution, height, hue}: {resolution: number, height: number, hue: number}) => {

    //H values are determined by a seperate slider, so we will just store that in a prop

    //S values of hsl increase as the box does from 0 to 100 left to right
    const sValues = new Array()
    for (let s = 0; s < resolution; s++) {
        sValues.push((100 / resolution) * s)
    }

    //L values are weird, TL: 100% TR: 50% Bottom: 0% so we need to interpolate horizontally the max
    //values then interpolate vertically between those max values and 0 (top to bottom)
    const lValues = new Array()
    for (let ly = 0; ly < height; ly++) {

        let topValue = 100 - ((50 / resolution) * ly)
        
        let colLValues = new Array()

        for (let lx = 0; lx < resolution; lx++) {
    
            let value = topValue - ((topValue / height) * lx)
            colLValues.push(value)
    
        }

        lValues.push(colLValues)
    }

    //Create a table out of the colors
    const items = new Array()
    for (let y = 0; y < resolution; y++) {
        let boxes = new Array()
        for (let x = 0; x < height; x++) {
            boxes.push(<ColorBox h={hue} s={sValues[x]} l={lValues[x][y]} />)
        }
        items.push(<ColorRow children={boxes} />)
    }

    return(
        <ColorTable children={items} />
    )
}

const ColorTable = ({children}) => {
    return(
        <table className="w-1/2 h-full">{children}</table>
    )
}

ColorTable.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
    ])
}

const ColorRow = ({children}) => {
    return(
        <tr>{children}</tr>
    )
}

ColorRow.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
    ])
}

const ColorBox = ({h, s, l}: {h: number, s: number, l: number}) => {

    const[selected, setSelected] = useState(false);

    function toggleColor() {
        setSelected(!selected)
        console.log("hsl(" + h +", " + s + "%, " + l + "%)")
    }

    return(
        <td className="w-1 p-0" style={{height: "2%"}}>
            <div className={(!selected || "border-2 border-black") + " h-full m-0 p-0"} style={{backgroundColor: "hsl(" + h +", " + s + "%, " + l + "%)"}} onClick={() => toggleColor()}></div>
        </td>
    )
}