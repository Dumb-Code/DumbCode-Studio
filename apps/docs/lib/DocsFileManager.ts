import { readdir } from 'fs/promises';
import { join } from 'path';
import { isSupportedLanguage, SupportedLanguage } from './SupportedLanguages';

//The keys to check the header for.
//Slug and language are done automatically
export const DocHeaderKeysToCheck: (keyof DocHeader)[] = ["name", "description"];

const BASE_DIR = join(process.cwd(), "_data");
const EXTENSION = '.mdx';
const ORDERING_PREFIX = /^\d+-/ //Allows the folders/files to be ordered by prefixing them with a number, e.g. 01-Getting-Started

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
  unprefixed: {
    category: string;
    slug: string;
  }
}

export type DocsFileSection = {
  name: string,
  unprefixed: string,
  language: SupportedLanguage
}

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
    unprefixed: section.replace(ORDERING_PREFIX, ''),
    language,
  }
}

export const getAllSections = async (category: string, slug: string, preferredLang: SupportedLanguage): Promise<DocsFileSection[]> => {
  const fullCategory = await getUnprefixedFilePath('', category);
  const fullSlug = await getUnprefixedFilePath(fullCategory, slug);

  const sectionNames = await readdir(`${BASE_DIR}/${fullCategory}/${fullSlug}`)
  const sections = sectionNames
    .filter(section => section !== 'header.json')
    .map(section => getLangOrEnglishSection(fullCategory, fullSlug, section, preferredLang));
  return Promise.all(sections);
}


const getDocFile = async (category: string, slug: string): Promise<DocsFile> => {
  return {
    category,
    slug,
    unprefixed: {
      category: category.replace(ORDERING_PREFIX, ''),
      slug: slug.replace(ORDERING_PREFIX, ''),
    }
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

const getUnprefixedFilePath = async (base: string, search: string) => {
  const entries = await readdir(`${BASE_DIR}${base.length !== 0 ? `/${base}` : ''}`);
  const fullEntry = entries.find(c => c === search || c.replace(ORDERING_PREFIX, '') === search);
  if (!fullEntry) {
    throw new Error(`Category ${fullEntry} not found`);
  }
  return fullEntry;
}

export const getHeaderFilePath = async (category: string, slug: string): Promise<string> => {
  const fullCategory = await getUnprefixedFilePath('', category);
  const fullSlug = await getUnprefixedFilePath(fullCategory, slug);
  return `${BASE_DIR}/${fullCategory}/${fullSlug}/header.json`;
}

export const getDocsFilePath = async (category: string, slug: string, section: string, language: SupportedLanguage): Promise<string> => {
  const fullCategory = await getUnprefixedFilePath('', category);
  const fullSlug = await getUnprefixedFilePath(fullCategory, slug);
  return `${BASE_DIR}/${fullCategory}/${fullSlug}/${section}/${language}${EXTENSION}`;
}

