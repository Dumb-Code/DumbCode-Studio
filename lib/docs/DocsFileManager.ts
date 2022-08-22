import { readdir } from 'fs/promises';
import { join } from 'path';
import { isSupportedLanguage, SupportedLanguage } from './../lang/SupportedLanguages';

//The keys to check the header for.
//Slug and language are done automatically
export const DocHeaderKeysToCheck: (keyof DocHeader)[] = ["name", "description"];

//There are perhaps too many types here...
export type DocHeader = {
  name: string;
  description: string;
}
export type DocHeaderFile = Partial<Record<SupportedLanguage, DocHeader>> & { 'en': DocHeader };

export type Doc<S = string> = DocHeader & {
  headerWantedLanguage: SupportedLanguage;
  headerLanguage: SupportedLanguage;
  sections: DocSection<S>[];
}
export type DocSection<S = string> = {
  content: S,
  name: string,
  language: SupportedLanguage,
  wantedLanguage: SupportedLanguage,
}

export type DocsFile = {
  category: string;
  slug: string;
}

export type DocsFileSection = {
  name: string,
  language: SupportedLanguage
}

const BASE_DIR = join(process.cwd(), "docs");
const EXTENSION = '.mdx';

const getSupportedLanguages = async (category: string, slug: string, section: string): Promise<SupportedLanguage[]> => {
  //Read the files at `${BASE_DIR}/${category}/${slug}
  //These will be the en.mdx, de.mdx, etc.
  const files = await readdir(`${BASE_DIR}/${category}/${slug}/${section}`);
  const supportedLanguages = files
    .filter(file => file.endsWith(EXTENSION))
    .map(file => file.replace(EXTENSION, ''))
    .filter(isSupportedLanguage);

  //English is required
  if (!supportedLanguages.includes('en')) {
    throw new Error(`No english version found for ${category}/${slug}. Supported: ${supportedLanguages}`);
  }

  return supportedLanguages;
}

const getLangOrEnglishSection = async (category: string, slug: string, section: string, preferredLang: SupportedLanguage): Promise<DocsFileSection> => {
  const supportedLanguages = await getSupportedLanguages(category, slug, section);
  const language = supportedLanguages.includes(preferredLang) ? preferredLang : 'en';
  return {
    name: section,
    language,
  }
}

export const getAllSections = async (category: string, slug: string, preferredLang: SupportedLanguage): Promise<DocsFileSection[]> => {
  const sectionNames = await readdir(`${BASE_DIR}/${category}/${slug}`)
  const sections = sectionNames
    .filter(section => section !== 'header.json')
    .map(section => getLangOrEnglishSection(category, slug, section, preferredLang));
  return Promise.all(sections);
}


const getDocFile = async (category: string, slug: string): Promise<DocsFile> => {
  return {
    category,
    slug,
  };
}

const getCategoryFiles = async (category: string): Promise<DocsFile[]> => {
  const files = await readdir(`${BASE_DIR}/${category}`);
  const docFiles = files.map(slug => getDocFile(category, slug));
  return Promise.all(docFiles);
}

export const getAllDocFiles = async (): Promise<DocsFile[]> => {
  const categories = await readdir(BASE_DIR)
  const allDocFiles = await Promise.all(categories.map(getCategoryFiles))
  return allDocFiles.flat();
}

export const getHeaderFilePath = (category: string, slug: string): string => {
  return `${BASE_DIR}/${category}/${slug}/header.json`;
}

export const getDocsFilePath = (category: string, slug: string, section: string, language: SupportedLanguage): string => {
  return `${BASE_DIR}/${category}/${slug}/${section}/${language}${EXTENSION}`;
}

