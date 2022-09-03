import { useOptions } from "../../../../../contexts/OptionsContext";
import OptionButton from "../../OptionButton";
import { OptionCategorySection } from "../../OptionCategories";

const PhotoshopEnabledComponent = () => {
  const { photoshopEnabled, setPhotoshopEnabled } = useOptions();
  return (
    <>
      <OptionButton isSelected={photoshopEnabled} toggle={() => setPhotoshopEnabled(true)}>Enabled</OptionButton>
      <OptionButton isSelected={!photoshopEnabled} toggle={() => setPhotoshopEnabled(false)}>Disabled</OptionButton>
    </>
  )
}

const PhotoshopEnabled: OptionCategorySection = {
  title: "Photoshop",
  description: "Enables or disables photoshop integration.",
  component: PhotoshopEnabledComponent,
}
export default PhotoshopEnabled