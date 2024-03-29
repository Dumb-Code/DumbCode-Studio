import { useEffect } from "react";
import { useStudio } from "../../../contexts/StudioContext";
import { useListenableObject } from "../../../studio/listenableobject/ListenableObject";




export const useShowcaseGumball = () => {
  const { getSelectedProject, transformControls, onTopScene } = useStudio();
  const { showcaseProperties: properties, selectedCubeManager } = getSelectedProject();

  const [cubes] = useListenableObject(selectedCubeManager.selected);

  const [view] = useListenableObject(properties.selectedView);
  const [selectedLight] = useListenableObject(view.selectedLight);

  const gumball = properties.gumball;

  useEffect(() => {
    if (selectedLight === null) {
      return;
    }
    transformControls.attach(gumball.transformAnchor);
    transformControls.mode = "translate";
    transformControls.space = "world";
    transformControls.enabled = true;



    const position = selectedLight.light.position;
    gumball.visualAnchor.position.copy(position);
    gumball.transformAnchor.position.copy(position);

    const objectChange = () => {
      const position = gumball.transformAnchor.position;
      selectedLight.direction.value = [position.x, position.y, position.z];
      gumball.visualAnchor.position.copy(position);
    };


    onTopScene.add(gumball.visualAnchor);
    transformControls.addEventListener("objectChange", objectChange);

    return () => {
      //Only detach if there are no cubes selected and the light is not selected
      if (cubes.length === 0 && view.selectedLight.internalValue === null) {
        transformControls.detach();
        transformControls.enabled = false;
        transformControls.removeEventListener("objectChange", objectChange);
      }
      onTopScene.remove(gumball.visualAnchor);
    };
  }, [transformControls, gumball, selectedLight, view, onTopScene, cubes]);

};
