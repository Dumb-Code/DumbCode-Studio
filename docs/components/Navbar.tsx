import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { SvgDiscord, SvgGithub } from "../../studio/src/components/Icons";

const logo = '/images/brand/logo.svg'

const Navbar = () => {

  return (
    <div className="border-b border-black shadow-xl shadow-black">
      <div className="hidden lg:block w-screen">
        <DesktopNavbar />
      </div>
      <div className="lg:hidden w-screen">
        <MobileNavbar />
      </div>
    </div>
  );
}

const MobileNavbar = () => {

  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  }

  return (
    <>
      <div className="bg-gray-900 w-screen h-14 md:pl-10 flex flex-row">
        <NavbarBrandButton />
        <div className="flex-grow"></div>
        <MobileNavOpenButton open={open} toggleOpen={toggleOpen} />
      </div>
      {open && <MobileNavbarItems />}
    </>
  );
}

const MobileNavOpenButton = ({ open, toggleOpen }: { open: boolean, toggleOpen: () => void }) => {
  return (
    <div className="mt-5 mr-2 md:mr-10 group" onClick={toggleOpen}>
      <div className={(open ? "translate-y-1 -rotate-45 group-hover:bg-red-500" : "-translate-y-2 group-hover:bg-gray-500") + " rounded-full h-1 w-8 bg-white transition-all"}></div>
      <div className={(open ? "opacity-0 group-hover:bg-red-500" : "opacity-100 group-hover:bg-gray-500") + " rounded-full h-1 w-8 bg-white  transition-all"}></div>
      <div className={(open ? "-translate-y-1 rotate-45 group-hover:bg-red-500" : "translate-y-2 group-hover:bg-gray-500") + " rounded-full h-1 w-8 bg-white transition-all"}></div>
    </div>
  );
}

const DesktopNavbar = () => {

  return (
    <div className="bg-gray-900 w-screen h-14 flex flex-row z-50">
      <div className="relative w-1/4">
        <div className="absolute right-0 w-72">
          <NavbarBrandButton />
        </div>
      </div>
      <div className="lg:w-1/2 px-16 object-right flex flex-row-reverse">
        <NavbarButton name="STUDIO" route="/" />
        <NavbarButton name="DOCS" route="/studio" />
      </div>
      <div className="lg:w-1/4 lg:mr-10 pt-3 flex flex-row bg-gray-900 pb-4 lg:pb-0">
        <div className="lg:hidden flex-grow"></div>
        <NavbarIconButton icon={<SvgDiscord className="h-6 w-6 text-center" />} route="https://discord.gg/6mygAnq" />
        <NavbarIconButton icon={<SvgGithub className="h-6 w-6 text-center" />} route="https://github.com/Dumb-Code" />
        <div className="lg:hidden flex-grow"></div>
      </div>
    </div>
  );
}

const NavbarBrandButton = () => {

  const router = useRouter();
  const takeHome = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    router.push("/");
  }

  return (
    <div className="bg-gray-900 px-4 text-white text-xs capitalize hover:bg-gray-700 h-full font-semibold flex flex-row cursor-pointer"
      onClick={takeHome}>
      <div className="mt-4 mr-2 h-6 w-6 relative bg-gray-300">
        <Image alt="logo" src={logo} layout="fill" />
      </div>
      <p className="pt-5">DUMBCODE STUDIO DOCS</p>
    </div>
  );
}

const MobileNavbarItems = () => {
  return (
    <div className="w-full lg:flex lg:flex-row lg:bg-gray-900 bg-gray-800 relative top-0 z-50">
      <div className="lg:flex-grow">
        <NavbarButton name="STUDIO" route="/" />
        <NavbarButton name="DOCS" route="/studio" />
      </div>
      <div className="lg:pr-4 lg:mr-10 pt-3 flex flex-row bg-gray-900 pb-4 lg:pb-0">
        <div className="lg:hidden flex-grow"></div>
        <NavbarIconButton icon={<SvgDiscord className="h-6 w-6 text-center" />} route="https://discord.gg/6mygAnq" />
        <NavbarIconButton icon={<SvgGithub className="h-6 w-6 text-center" />} route="https://github.com/Dumb-Code" />
        <div className="lg:hidden flex-grow"></div>
      </div>
    </div>
  );
}

const NavbarButton = ({ name, route }: { name: string, route: string }) => {

  const router = useRouter();
  const handleClick = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    router.push(route);
  }

  return (
    <button className="bg-gray-900 px-4 text-white text-xs capitalize hover:bg-gray-700 lg:h-full font-semibold transition-colors lg:w-auto w-full h-10"
      onClick={handleClick}>
      {name}
    </button>
  );
}

const NavbarIconButton = ({ icon, route }: { icon: JSX.Element, route: string }) => {

  return (
    <a target="_blank" rel="noreferrer" href={route} className="bg-gray-900 pl-1 pt-1 text-white text-xs capitalize hover:bg-gray-700 h-8 w-8 rounded-full font-semibold transition-all mx-1 hover:scale-110">
      {icon}
    </a>
  );
}

export default Navbar;