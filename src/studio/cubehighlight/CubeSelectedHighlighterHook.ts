import { useEffect } from 'react';
import { useStudio } from "../../contexts/StudioContext";


export const useSelectedCubeHighlighter = () => {
  const { getSelectedProject, onFrameListeners, getCamera } = useStudio();
  const project = getSelectedProject();

  useEffect(() => {
    const onFrame = () => project.cubeHighlighter.onFrame(getCamera());
    onFrameListeners.add(onFrame);
    return () => {
      onFrameListeners.delete(onFrame);
    };
  }, [project, getCamera, onFrameListeners]);
};
