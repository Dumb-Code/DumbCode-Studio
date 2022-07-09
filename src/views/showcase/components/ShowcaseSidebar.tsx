import HistoryList from "../../../components/HistoryList"
import ShowcaseLights from "./ShowcaseLights"
import ShowcaseScreenshot from "./ShowcaseScreenshot"

const ShowcaseSidebar = () => {
  return (
    <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
      <ShowcaseScreenshot />
      <ShowcaseLights />
      <HistoryList />
    </div>
  )
}

export default ShowcaseSidebar