import { unsafe_getKeyComboCategories } from "../../../studio/keycombos/KeyCombos";
import ReducedAnimations from "./categories/accessibility/ReducedAnimations";
import LinkedGithubAccount from "./categories/account/LinkedGithubAccount";
import CompactModeSelection from "./categories/appearance/CompactModeSelection";
import ThemeSelection from "./categories/appearance/ThemeSelection";
import AutoRecovery from "./categories/general/AutoRecovery";
import PhotoshopEnabled from "./categories/general/PhotoshopEnabled";
import PWAInstall from "./categories/general/PWAInstall";
import ScreenshotAction from "./categories/general/ScreenshotAction";
import SelectedCubesSection from "./categories/general/SelectedCubes";
import KeyBindSection from "./categories/keybinds/KeyBindSection";
import SelectLanguage from "./categories/language/SelectLanguage";
import LinksToOurStuff from "./categories/links/LinksToOurStuff";

export type OptionCategory = {
  shortName: string,
  title: string;
  sections: readonly OptionCategorySection[];
  headerComponent?: () => JSX.Element;
}

export type OptionCategorySection = {
  title: string
  description?: string
  additionalText?: string;
  shouldRender?: (blockedBySearch: (str: string) => boolean) => boolean;
  component: () => JSX.Element
}

export const OptionCategories: Record<string, OptionCategory> = {
  general: {
    shortName: "General",
    title: "General Options",
    sections: [PWAInstall, ScreenshotAction, SelectedCubesSection, AutoRecovery, PhotoshopEnabled],
  },
  appearance: {
    shortName: "Appearance",
    title: "Appearance Options",
    sections: [ThemeSelection, CompactModeSelection]
  },
  account: {
    shortName: "Linked Accounts",
    title: "Linked Account Options",
    sections: [LinkedGithubAccount]
  },
  language: {
    shortName: "Language",
    title: "Language Options",
    sections: [SelectLanguage]
  },
  accessibility: {
    shortName: "Accessibility",
    title: "Accessibility Options",
    sections: [ReducedAnimations]
  },
  keyBindOptions: {
    shortName: "Key Binds",
    title: "Key Bindings",
    sections: unsafe_getKeyComboCategories().map(KeyBindSection),
  },
  linksToOurStuff: {
    shortName: "Links",
    title: "Dumbcode Links",
    sections: LinksToOurStuff
  }
}


export const OptionCategoryKeys: string[] = Object.keys(OptionCategories);