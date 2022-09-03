import { SvgPoweredByVercel } from "@dumbcode/shared/icons";
import Link from 'next/link';

const Footer = () => {
  const test = "test";
  return (
    <footer className="footer bg-gray-900 xl:px-60 lg:px-20 px-0 py-20">
      <div className="grid grid-flow-row md:grid-cols-4 px-4 md:px-20 lg:grid-cols-7 gap-y-10 gap-x-10 lg:gap-x-2">
        <div className="text-gray-700 text-xs mx-4 w-full col-span-2">
          <h1 className="text-3xl">Stay Connected</h1>
          <p>Join our community of over 1300 users following our mod. We post updates on all our products on our media locations.</p>
          <a className="text-blue-500" href="https://discord.gg/6mygAnq">Discord</a><br />
          <a className="text-blue-500" href="https://github.com/Dumb-Code">GitHub</a><br />
          <a className="text-blue-500" href="https://twitter.com/dumbcodemc">Twitter</a><br />
          <a className="text-blue-500" href="https://www.deviantart.com/projectnublar">Devianart</a><br />
          <a className="text-blue-500" href="https://www.youtube.com/channel/UCjGWjtS8OMznjzTzpxQ0QYQ">YouTube</a><br />
          <a className="text-blue-500" href="https://www.artstation.com/dumbcodemc">ArtStation</a><br />
        </div>
        <div className="text-gray-700 text-xs mx-4 w-full col-span-2">
          <h1 className="text-3xl">Our Mission</h1>
          <div>The DumbCode <div className="text-blue-500 inline-block"><Link href="/team">Team</Link></div> is commited to bringing high quality content to members of our community and expanding our community to new interested people. We believe in equal opportunity to contributors and we will strive to create a fair workplace while keeping the progress organized and thought out.</div>
        </div>
        <div className="mx-4 w-full col-span-2 lg:col-span-1">
          <div className="text-gray-700 text-xs">
            <h1 className="text-3xl">Our Stuff</h1>
          </div>
          <div className="text-gray-700 text-xs">
            <p className="my-0">Mods</p>
            <div className="text-blue-500"><Link href="/mods/projectnublar">Project: Nublar</Link></div>
            <div className="text-blue-500"><Link href="/mods/dumblibrary">Dumb Library</Link></div>
          </div>
          <br />
          <div className="text-gray-700 text-xs">
            <p className="my-0">Tools</p>
            <div className="text-blue-500"><Link href="/studio">Dumbcode Studio</Link></div>
            <div className="text-blue-500"><Link href="/mods/gradlehook">Gradlehook</Link></div>
          </div>
        </div>
        <div className="mx-4 w-full col-span-2">
          <div className="text-gray-700 text-xs">
            <h1 className="text-3xl">Other Stuff</h1>
            <p>DumbCode is in no way affiliated with Minecraft or its owners Mojang Studios. Our content licenses are placed under their corresponding code repositories and should be treated as true pieces of software.</p>
            <div className="text-gray-700 text-xs mt-2 mb-10">DumbCode Website updated 2021.</div>
            <a href="https://vercel.com/?utm_source=dumbcode&utm_campaign=oss"><SvgPoweredByVercel /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;