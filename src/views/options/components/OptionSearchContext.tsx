import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";

type ContextType = {
  Highlight: (props: { str?: string }) => JSX.Element
  blockedBySearch: (str: string) => boolean
}
const Context = createContext<ContextType>({
  Highlight: ({ str }) => <>{str}</>,
  blockedBySearch: () => false
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
    const parts = splitString(str);
    return (
      <>
        {parts.map((part, index) => <StringHighlightComponent key={index} part={part} />)}
      </>
    );
  }, [splitString]);

  const blockedBySearch = useCallback((str: string) => {
    if (searchTerms === undefined) {
      return false;
    }
    const lower = str.toLocaleLowerCase();
    return !searchTerms.some(term => lower.includes(term));
  }, [searchTerms]);

  return (
    <Context.Provider value={{ Highlight, blockedBySearch }}>
      {children}
    </Context.Provider>
  )
}


const StringHighlightComponent = ({ part }: { part: StringHighlightPart }) => {
  return (
    <span className={`${part.highlight ? "text-blue-500 bg-yellow-400" : ""} whitespace-pre`}>
      {part.string}
    </span>
  )
}

export default OptionSearchContext