import { readFile } from "fs/promises";
import { SupportedLanguage } from "../lang/SupportedLanguages";
import { Doc, DocHeaderFile, DocSection, getAllSections, getDocsFilePath, getHeaderFilePath } from "./DocsFileManager";



const parseDoc = async (category: string, slug: string, preferredLang: SupportedLanguage): Promise<Doc> => {
  //Fallback on english if the language is not supported
  const [headerFile, allFiles] = await Promise.all([
    readHeader(category, slug),
    readAllDocFiles(category, slug, preferredLang)
  ] as const)

  const header = headerFile[preferredLang] ?? headerFile['en'];

  return {
    ...header,
    sections: allFiles,
  }
}

const readHeader = async (category: string, slug: string): Promise<DocHeaderFile> => {
  const file = await readFile(getHeaderFilePath(category, slug))
  return JSON.parse(file.toString())
}

const readAllDocFiles = async (category: string, slug: string, preferredLang: SupportedLanguage): Promise<DocSection[]> => {
  const sectionFiles = await getAllSections(category, slug, preferredLang);
  const sections = sectionFiles.map(section =>
    readFile(getDocsFilePath(category, slug, section.name, section.language))
      .then<DocSection>(file => ({
        name: section.name,
        language: section.language,
        wantedLanguage: preferredLang,
        content: file.toString(),
      }))
  );
  return await Promise.all(sections);
}

export default parseDoc;