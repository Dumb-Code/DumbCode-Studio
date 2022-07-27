import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";

type ContextType = {
  Highlight: (props: { str?: string }) => JSX.Element
  isContainedInSearch: (str: string) => boolean
}
const Context = createContext<ContextType>({
  Highlight: ({ str }) => <>{str}</>,
  isContainedInSearch: () => false
});


type StringHighlightPart = {
  string: string,
  highlight: boolean
}

export const useOptionSearchContext = () => useContext(Context)

const OptionSearchContext = ({ search, children }: { search: string, children: ReactNode }) => {
  const searchTerms = useMemo(() => search?.toLocaleLowerCase()?.split(" "), [search]);

  //Split the title and description into parts that are highlighted if they match the search terms
  const splitString = useCallback((str: string): StringHighlightPart[] => {
    if (searchTerms === undefined) {
      return [{ string: str, highlight: false }];
    }

    const regex = new RegExp(searchTerms.map(term => `(${term})`).join("|"), "gi");
    let array = regex.exec(str);
    if (array === null) {
      return [{ string: str, highlight: false }];
    }

    const parts: StringHighlightPart[] = [];
    let lastIndex = 0;
    while (array !== null) {
      parts.push({ string: str.substring(lastIndex, array.index), highlight: false });
      parts.push({ string: array[0], highlight: true });
      lastIndex = array.index + array[0].length;
      array = regex.exec(str);
    }
    parts.push({ string: str.substring(lastIndex), highlight: false });
    return parts;
  }, [searchTerms]);



  const Highlight = useCallback(({ str }: { str?: string }) => {
    if (str === undefined) {
      return <>{str}</>;
    }
    console.log(str)
    const parts = splitString(str);
    return (
      <>
        {parts.map((part, index) =>
          part.highlight ?
            <StringHighlightPart key={index} string={part.string} /> :
            part.string
        )}
      </>
    );
  }, [splitString]);

  const isContainedInSearch = useCallback((str: string) => {
    if (searchTerms === undefined) {
      return false;
    }
    const lower = str.toLocaleLowerCase();
    return searchTerms.some(term => lower.includes(term));
  }, [searchTerms]);

  return (
    <Context.Provider value={{ Highlight, isContainedInSearch }}>
      {children}
    </Context.Provider>
  )
}


const StringHighlightPart = ({ string }: { string: string }) => {
  return (
    <span className="text-blue-500 bg-yellow-400">
      {string}
    </span>
  )
}

export default OptionSearchContext