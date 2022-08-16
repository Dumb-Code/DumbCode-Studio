import { GetStaticPaths, GetStaticProps } from "next";
import { Doc, getAllDocFiles } from "../../../../lib/docs/DocsFileManager";
import parseDoc from "../../../../lib/docs/parseDoc";
import SupportedLanguages, { SupportedLanguage } from "../../../../lib/lang/SupportedLanguages";

type Props = {
  content: Doc //TODO render the doc
}

type PathProps = {
  lang: SupportedLanguage; //Does not matter if the language is supported
  category: string;
  slug: string;
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
              {s.content}
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

  return {
    props: {
      content: file
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