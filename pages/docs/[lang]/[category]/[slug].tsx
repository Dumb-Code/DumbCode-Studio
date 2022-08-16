import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from 'next-mdx-remote/serialize';
import Test from "../../../../components/docs/Test";
import { Doc, getAllDocFiles } from "../../../../lib/docs/DocsFileManager";
import parseDoc from "../../../../lib/docs/parseDoc";
import SupportedLanguages, { SupportedLanguage } from "../../../../lib/lang/SupportedLanguages";

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
    <div>
      <>
        <div>Name: {content.name}</div>
        <div>Description: {content.description}</div>
        {content.sections.map((s, i) => (
          <div key={i} className="border-t border-black mt-5">
            <h1>Title: {s.name}</h1>
            <h1>Needs Translating: {s.language === s.wantedLanguage ? "No" : "Yes"}</h1>
            <div className="border-b border-black pt-2">
              <MDXRemote {...s.content} components={Components} />
            </div>
          </div>
        ))}
      </>
    </div>
  )
}

export const getStaticProps: GetStaticProps<Props, PathProps> = async (context) => {
  if (!context.params) {
    throw new Error("No params");
  }
  const { lang, category, slug } = context.params;

  const file = await parseDoc(category, slug, lang);


  const renderedDoc: Doc<MDXRemoteSerializeResult> = {
    name: file.name,
    description: file.description,
    sections: await Promise.all(file.sections.map(async (s) => {
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