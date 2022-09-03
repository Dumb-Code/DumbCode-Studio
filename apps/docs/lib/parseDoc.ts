import { readFile } from "fs/promises";
import { Doc, DocHeaderFile, DocSection, getAllSections, getDocsFilePath, getHeaderFilePath } from "./DocsFileManager";
import { SupportedLanguage } from "./SupportedLanguages";



const parseDoc = async (category: string, slug: string, preferredLang: SupportedLanguage): Promise<Doc> => {
  //Fallback on english if the language is not supported
  const [headerFile, allFiles] = await Promise.all([
    readHeader(category, slug),
    readAllDocFiles(category, slug, preferredLang)
  ] as const)

  const hasLang = headerFile[preferredLang] !== undefined;
  const header = headerFile[preferredLang] ?? headerFile['en'];

  return {
    ...header,
    headerWantedLanguage: preferredLang,
    headerLanguage: hasLang ? preferredLang : 'en',
    sections: allFiles,
  }
}

const readHeader = async (category: string, slug: string): Promise<DocHeaderFile> => {
  const file = await readFile(await getHeaderFilePath(category, slug))
  return JSON.parse(file.toString())
}

const readAllDocFiles = async (category: string, slug: string, preferredLang: SupportedLanguage): Promise<DocSection[]> => {
  const sectionFiles = await getAllSections(category, slug, preferredLang);
  const sections = sectionFiles.map(async section =>
    readFile(await getDocsFilePath(category, slug, section.name, section.language))
      .then<DocSection>(file => ({
        name: section.unprefixed,
        language: section.language,
        wantedLanguage: preferredLang,
        content: file.toString(),
      }))
  );
  return await Promise.all(sections);
}

export default parseDoc;