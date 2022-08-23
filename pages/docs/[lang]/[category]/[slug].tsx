import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from 'next-mdx-remote/serialize';
import Footer from "../../../../components/docs/Footer";
import Navbar from "../../../../components/docs/Navbar";
import Test from "../../../../components/docs/Test";
import { Doc, getAllDocFiles } from "../../../../lib/docs/DocsFileManager";
import parseDoc from "../../../../lib/docs/parseDoc";
import SupportedLanguages, { SupportedLanguage } from "../../../../lib/lang/SupportedLanguages";
import { SVGSearch } from "../../../../src/components/Icons";

type Props = {
  content: Doc<MDXRemoteSerializeResult>
}

type PathProps = {
  lang: SupportedLanguage; //Does not matter if the language is supported
  category: string;
  slug: string;
}

const Components = {
  Test
}

const DocPage = ({ content }: Props) => {
  return (
    <div className="bg-gray-900">
      
      <Navbar />

      <div className="flex flex-row bg-gray-900 min-h-screen">

        <div className="w-1/4 bg-gray-800 relative text-gray-300">
          <div className="w-72 absolute right-0 p-3">
            <SearchBar />
            <SectionItem name="Some Section" />
            <SubSectionItem name="Sub Section 1" active={true} />
            <SubSectionItem name="Sub Section 2" active={false} />
          </div>
        </div>

        <div className="w-1/2 text-gray-300 bg-gray-800 pt-8 px-16">
          <div>Name: {content.name}</div>
          <div>Description: {content.description}</div>
          <div>Header Needs Translating: {content.headerLanguage === content.headerWantedLanguage ? "No" : "Yes"}</div>
          {content.sections.map((s, i) => (
            <div key={i} className="border-t border-black mt-5">
              <h1>Title: {s.name}</h1>
              <h1>Needs Translating: {s.language === s.wantedLanguage ? "No" : "Yes"}</h1>
              <div className="border-b border-black pt-2">
                <MDXRemote {...s.content} components={Components} />
              </div>
            </div>
          ))}
        </div>

        <div className="w-1/4 bg-gray-800">
          on this page
        </div>

      </div>
      <Footer />
    </div>
  )
}

const SearchBar = () => {
  return (
    <div className="bg-gray-900 rounded-md flex flex-row p-3 text-gray-300 cursor-text">
      <SVGSearch className="h-5 w-5" />
      <p className="text-xs mt-0.5 ml-2">Search Everywhere</p>
    </div>
  )
}

const SectionItem = ({ name }: { name: String }) => { 
  return (
    <p className="text-md font-semibold pt-1 pb-2 pl-2 uppercase">
      {name}
    </p>
  )
}

const SubSectionItem = ({ name, active }: { name: String, active: boolean }) => { 
  return (
    <div className={"border-l ml-2 pl-2 text-xs py-1" + (active ? " text-white border-blue-600" : " border-gray-700")}>
      {name}
    </div>
  )
}

export const getStaticProps: GetStaticProps<Props, PathProps> = async (context) => {
  if (!context.params) {
    throw new Error("No params");
  }
  const { lang, category, slug } = context.params;

  const file = await parseDoc(category, slug, lang);

  const { sections, ...otherProps } = file

  const renderedDoc: Doc<MDXRemoteSerializeResult> = {
    ...otherProps,
    sections: await Promise.all(sections.map(async (s) => {
      const content = await serialize(s.content);
      return {
        name: s.name,
        language: s.language,
        wantedLanguage: s.wantedLanguage,
        content
      }
    }))
  }

  return {
    props: {
      content: renderedDoc
    },
  }
}

export const getStaticPaths: GetStaticPaths<PathProps> = async () => {
  const docFiles = await getAllDocFiles()
  return {
    paths: SupportedLanguages.flatMap(lang =>
      docFiles.map(docFile => ({
        params: {
          lang: lang,
          category: docFile.category,
          slug: docFile.slug
        },
      }))
    ),
    fallback: false
  }
}

export default DocPage