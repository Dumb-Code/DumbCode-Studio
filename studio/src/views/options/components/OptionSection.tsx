import { ReactNode } from "react";
import { useOptionSearchContext } from "./OptionSearchContext";



const OptionSection = ({ title, description, search, children }: {
  title: string,
  description?: string,
  search?: string,
  children: ReactNode;
}) => {

  const { Highlight } = useOptionSearchContext()

  return (
    <div className="mt-5 first:mt-0">
      <p className="text-gray-900 text-xs font-semibold">{<Highlight str={title} />}</p>
      {description !== undefined && (
        <p className="text-gray-900 text-xs mb-2">
          <Highlight str={description} />
        </p>
      )}
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  )
}


export default OptionSection