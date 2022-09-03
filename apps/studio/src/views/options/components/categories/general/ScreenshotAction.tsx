import { useOptions } from "../../../../../contexts/OptionsContext"
import { AllScreenshotActionTypes, ScreenshotDesciptionMap, ScreenshotIconMap } from "../../../../../studio/screenshot/ScreenshotActions"
import OptionButton from "../../OptionButton"
import { OptionCategorySection } from "../../OptionCategories"

const ScreenshotActionComponent = () => {

  const { selectedScreenshotAction, setScreenshotAction } = useOptions()

  return (
    <>
      {AllScreenshotActionTypes.map(action => {
        const Icon = ScreenshotIconMap[action]
        return (
          <OptionButton key={action} width="w-[400px]" isSelected={selectedScreenshotAction === action} toggle={() => setScreenshotAction(action)}>
            <div className="w-full h-full flex items-center">
              <Icon className="w-4 h-4 mr-2 -ml-2" />
              {ScreenshotDesciptionMap[action]}
            </div>
          </OptionButton>
        )
      })}
    </>
  )
}

const ScreenshotAction: OptionCategorySection = {
  title: "Screenshot Action",
  description: "Allows you to customize the way screenshots or showcase tab exports are saved.",
  component: ScreenshotActionComponent,
}
export default ScreenshotAction