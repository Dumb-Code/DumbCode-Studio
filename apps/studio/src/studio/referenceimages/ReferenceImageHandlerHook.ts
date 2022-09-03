import { useEffect } from 'react';
import { useStudio } from '../../contexts/StudioContext';
import { ReferenceImage } from './ReferenceImageHandler';


export const useReferenceImageTransform = (image: ReferenceImage) => {
  const { getSelectedProject, onMouseUp, transformControls } = useStudio();
  const { referenceImageHandler, selectedCubeManager, modelerGumball } = getSelectedProject();
  useEffect(() => {
    const updateTransformControls = ({ blockedReasons = modelerGumball.blockedReasons.value, mode = referenceImageHandler.mode.value, space = referenceImageHandler.space.value }) => {
      transformControls.visible = true;
      transformControls.enabled = blockedReasons.length === 0;

      transformControls.mode = mode;
      transformControls.space = space;
    };

    const objectChange = () => {
      if (transformControls.mode === "translate") {
        image.position.value = [
          image.mesh.position.x,
          image.mesh.position.y,
          image.mesh.position.z
        ];
        return;
      }

      if (transformControls.mode === "rotate") {
        image.rotation.value = [
          image.mesh.rotation.x * 180 / Math.PI,
          image.mesh.rotation.y * 180 / Math.PI,
          image.mesh.rotation.z * 180 / Math.PI
        ];
      }

      if (transformControls.mode === "scale") {
        let value: number;
        if (transformControls.axis?.includes("X")) {
          value = image.mesh.scale.x;
        } else if (transformControls.axis?.includes("Y")) {
          value = image.mesh.scale.y;
        } else {
          value = image.mesh.scale.z;
        }
        image.scale.value = value;
        image.flipX.value = image.mesh.scale.x !== image.mesh.scale.z;
        image.flipX.value = image.mesh.scale.y !== image.mesh.scale.z;
      }
    };

    const updateBlocked = (blockedReasons: readonly string[]) => updateTransformControls({ blockedReasons });
    const updateMode = (mode: "translate" | "rotate" | "scale") => updateTransformControls({ mode });
    const updateSpace = (space: "local" | "world") => updateTransformControls({ space });

    transformControls.attach(image.mesh);
    transformControls.addEventListener("objectChange", objectChange);
    modelerGumball.blockedReasons.addAndRunListener(updateBlocked);
    referenceImageHandler.mode.addListener(updateMode);
    referenceImageHandler.space.addListener(updateSpace);
    return () => {
      transformControls.detach();
      transformControls.removeEventListener("objectChange", objectChange);
      modelerGumball.blockedReasons.removeListener(updateBlocked);
      referenceImageHandler.mode.removeListener(updateMode);
      referenceImageHandler.space.removeListener(updateSpace);
    };
  }, [image, onMouseUp, referenceImageHandler, selectedCubeManager, transformControls, modelerGumball.blockedReasons]);
};
