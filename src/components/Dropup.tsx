import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { SVGChevronDown } from "./Icons";
import PropTypes from 'prop-types';

export default function Dropup({title, header, children, right, className}) {
    return(
        <div className="text-right">
        <Menu as="div" className="relative inline-block text-left">
            {({ open }) => (
            <>
                <div>
                    <Menu.Button className={className + " inline-flex justify-center w-full px-4 py-1 text-xs font-medium text-white bg-gray-900 rounded focus:outline-none hover:bg-gray-800"}>
                        {title}
                        <SVGChevronDown className="w-4 h-4 ml-2 -mr-1 transform rotate-180" />
                    </Menu.Button>
                </div>
                <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items static className={(right ? "right-0" : "left-0") + " absolute bottom-8 w-56 mt-2 origin-top-right bg-gray-900 text-white divide-y divide-black rounded shadow-lg focus:outline-none"}>
                        <p className="text-xs p-2 bg-black rounded-t">{header}</p>
                        {children}
                    </Menu.Items>
                </Transition>
            </>
            )}
        </Menu>
        </div>
    )
}
  
Dropup.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
    ]),
    header: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    right: PropTypes.bool,
    className: PropTypes.string
}

Dropup.defaultProps = {
    details: null,
}

export const DropupItem = ({name, onSelect}: {name: string, onSelect: () => void}) => {
    return(
        <Menu.Item>
        {({ active }) => (
            <button className={`${active ? "bg-gray-700 text-white" : "text-white bg-gray-900"} group flex rounded-md items-center w-full px-2 py-2 text-sm`} onClick={onSelect}>
            {name}
            </button>
        )}
        </Menu.Item>
    )
}