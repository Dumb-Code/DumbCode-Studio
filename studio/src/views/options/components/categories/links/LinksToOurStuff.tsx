import { OptionCategorySection } from "../../OptionCategories"

type Link = {
  title: string,
  text: string,
  description?: string,
  className?: string,
  href?: string,
}

const links: Link[] = [{
  title: "DumbCode Community Discord",
  text: "Discord",
  description: "Join our discord to connect with community members, get updates, and showcase your work.",
  href: "http://dumbcode.net/discord",
  className: "hover:bg-purple-600 dark:hover:bg-purple-600",
}, {
  title: "DumbCode Website",
  text: "Website",
  description: "Check out DumbCode's other projects.",
  href: "https://dumbcode.net",
  className: "hover:bg-sky-500 dark:hover:bg-sky-500",
}, {
  title: "DumbCode Studio Changelog",
  text: "Changelog",
  description: "Noticed a change in the app? Check our Changelog to see what all is new in this version.",
  href: "https://github.com/Dumb-Code/DumbCode-Studio/commits/next",
  className: "hover:bg-yellow-500 dark:hover:bg-yellow-500",
}, {
  title: "DumbCode Studio Issue Tracker",
  text: "Issue Tracker",
  description: "Found a bug? Well, add it to the list, we'll fix it right up!",
  href: "https://github.com/Dumb-Code/DumbCode-Studio/issues",
  className: "hover:bg-red-600 dark:hover:bg-red-600",
}, {
  title: "DumbCode Studio GitHub",
  text: "View Source",
  description: "Want to join in on the fun? Submit a pull request on our GitHub.",
  href: "https://github.com/Dumb-Code/DumbCode-Studio",
  className: "hover:bg-green-600 dark:hover:bg-green-600",
}]


const LinksToOurStuff: OptionCategorySection[] = links.map(link => ({
  title: link.title,
  description: link.description,
  component: () => (
    <a href={link.href} className={"dark:bg-gray-800 bg-gray-300 rounded w-80 dark:text-white text-black font-semibold p-2 text-left pl-4 my-1 " + (link.className ?? '')}>
      {link.text}
    </a>
  )
}))

export default LinksToOurStuff