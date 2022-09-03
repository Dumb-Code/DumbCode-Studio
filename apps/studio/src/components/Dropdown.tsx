import { SVGChevronDown } from "@dumbcode/shared/icons";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, PropsWithChildren } from "react";

export default function Dropdown({ title, header, children, right = false, className = "" }:
    PropsWithChildren<{ title: string, header: string, right?: boolean, className?: string }>
) {
    return (
        <div>
            <Menu as="div" className="relative inline-block text-left">
                {({ open }) => (
                    <>
                        <div>
                            <Menu.Button className={className + " inline-flex w-full px-4 py-1 text-xs font-medium dark:text-white text-black dark:bg-gray-900 bg-gray-300 rounded focus:outline-none  hover:bg-gray-100 dark:hover:bg-gray-800"}>
                                {title}
                                <SVGChevronDown className="w-4 h-4 ml-2 -mr-1" />
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
                            <Menu.Items static className={(right ? "right-0" : "left-0") + " absolute top-6 w-56 mt-2 origin-bottom-right dark:bg-gray-900 bg-gray-100 dark:text-white text-black divide-y divide-black rounded shadow-lg focus:outline-none"}>
                                <p className="text-xs p-2 dark:bg-black bg-white rounded-t">{header}</p>
                                {children}
                            </Menu.Items>
                        </Transition>
                    </>
                )}
            </Menu>
        </div>
    )
}

export const DropdownItem = ({ name, onSelect }: { name: string, onSelect: () => void }) => {
    return (
        <Menu.Item>
            {({ active }) => (
                <button className={`${active ? "dark:bg-gray-700 bg-gray-200 dark:text-white text-black" : "dark:text-white text-black dark:bg-gray-900 bg-gray-100"} group flex rounded-md items-center w-full px-2 py-2 text-sm`} onClick={onSelect}>
                    {name}
                </button>
            )}
        </Menu.Item>
    )
}