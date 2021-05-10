import { useState } from "react"

const LinksToOurStuff = () => {

    return(
        <div className="">
            <p className="text-white font-semibold mb-2">DUMBCODE LINKS</p>

            <p className="text-gray-900 text-xs font-semibold">DUMBCODE COMMUNITY DISCORD</p>
            <p className="text-gray-900 text-xs mb-1">Join our discord to connect with community members, get updates, and showcase your work.</p>
            <button className="bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1 hover:bg-purple-600">Discord</button>

            <p className="text-gray-900 text-xs font-semibold mt-4">DUMBCODE WEBSITE</p>
            <p className="text-gray-900 text-xs mb-1">Check out DumbCode's other projects.</p>
            <button className="bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1 hover:bg-lightBlue-500">Website</button>

            <p className="text-gray-900 text-xs font-semibold mt-4">DUMBCODE STUDIO CHANGELOG</p>
            <p className="text-gray-900 text-xs mb-1">Noticed a change in the app? Check our Changelog to see what all is new in this version.</p>
            <button className="bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1 hover:bg-yellow-500">Changelog</button>

            <p className="text-gray-900 text-xs font-semibold mt-4">DUMBCODE STUDIO ISSUE TRACKER</p>
            <p className="text-gray-900 text-xs mb-1">Found a bug? Well, add it to the list, we'll fix it right up!</p>
            <button className="bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1 hover:bg-red-600">Issue Tracker</button>

            <p className="text-gray-900 text-xs font-semibold mt-4">DUMBCODE STUDIO GITHUB</p>
            <p className="text-gray-900 text-xs mb-1">Want to join in on the fun? Submit a pull request on our GitHub.</p>
            <button className="bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1 hover:bg-green-600">View Source</button>
        </div>
    )
}

export default LinksToOurStuff