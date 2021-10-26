import { Transition } from "@headlessui/react"
import { useState } from "react"
import PropTypes from 'prop-types';

export const ButtonWithTooltip = ({ delay, className, tooltip, children, direction }) => {

    const [tooltipShown, showTooltip] = useState(false);
    const [isHovering, setHovering] = useState(false);

    function turnOn() {
        setHovering(true)
        setTimeout(() => {
            isHovering || showTooltip(true);
        }, delay);
    }

    function turnOff() {
        setHovering(false)
        showTooltip(false)
    }

    if (direction === undefined) {
        direction = "top";
    }

    return (
        <button className={className} onPointerOver={() => turnOn()} onPointerLeave={() => turnOff()}>
            {children}
            <Tooltip text={tooltip} shown={tooltipShown} direction={direction} />
        </button>
    )
}

ButtonWithTooltip.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
    ]),
    delay: PropTypes.number.isRequired,
    className: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    direction: PropTypes.string
}

export const Tooltip = ({ text, shown, direction }: { text: string, shown: boolean, direction: string }) => {

    var tooltipStyles = ""
    var tooltipStyleObject = {}
    var decorationStyles = ""

    if (direction === "top") {
        tooltipStyles = "bg-gray-100 dark:bg-gray-700 -mt-12 z-10 px-3 rounded"
        tooltipStyleObject = { marginLeft: -(text.length * 7) / 2 }
        decorationStyles = "h-2 w-2 transform rotate-45 translate-y-5 bg-gray-100 dark:bg-gray-700 absolute left-2 z-0"
    }
    if (direction === "bottom") {
        tooltipStyles = "bg-gray-100 dark:bg-gray-700 mt-4 z-10 px-3 rounded"
        tooltipStyleObject = { marginLeft: -(text.length * 7) / 2 }
        decorationStyles = "h-2 w-2 transform rotate-45 -translate-y-1 bg-gray-100 dark:bg-gray-700 absolute left-2 z-0"
    }
    if (direction === "right") {
        tooltipStyles = "bg-gray-100 dark:bg-gray-700 -mt-5 ml-10 z-10 px-3 rounded"
        tooltipStyleObject = {}
        decorationStyles = "h-2 w-2 transform rotate-45 translate-y-2 translate-x-9 bg-gray-100 dark:bg-gray-700 absolute z-0"
    }
    if (direction === "left") {
        tooltipStyles = "bg-gray-100 dark:bg-gray-700 -mt-5 z-10 px-3 rounded transform -translate-x-10"
        tooltipStyleObject = { marginLeft: -(text.length * 7) }
        decorationStyles = "h-2 w-2 transform rotate-45 translate-y-2 -translate-x-3.5 bg-gray-100 dark:bg-gray-700 absolute z-0"
    }

    return (
        <div className="absolute transform -translate-x-2 z-50">
            <Transition
                show={shown}
                enter="transition-opacity duration-75"
                enterFrom="opacity-0 transform translate-y-1"
                enterTo="opacity-100 transform -translate-y-1"
                leave="transition ease-in-out duration-150"
                leaveFrom="opacity-100 transform translate-y-1"
                leaveTo="opacity-0 transform -translate-y-1">
                <div className={decorationStyles}></div>
                <div className={tooltipStyles} style={tooltipStyleObject}>{text}</div>
            </Transition>
        </div>
    )
}