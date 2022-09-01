import { useEffect } from 'react';
import { useStudio } from '../../../contexts/StudioContext';


export const usePointTracking = () => {
  const { onMouseUp, onFrameListeners, getSelectedProject, raycaster } = useStudio();
  const { cubePointTracker, modelerGumball } = getSelectedProject();

  useEffect(() => {
    const onEnableEvent = () => {
      const reasons = modelerGumball.blockedReasons.value;
      if (!reasons.includes("point_tracker")) {
        modelerGumball.blockedReasons.value = modelerGumball.blockedReasons.value.concat("point_tracker");
      }
    };
    const onDisableEvent = () => {
      const reasons = modelerGumball.blockedReasons.value;
      if (reasons.includes("point_tracker")) {
        modelerGumball.blockedReasons.value = modelerGumball.blockedReasons.value.filter(v => v !== "point_tracker");
      }
    };
    cubePointTracker.addEventListener("enable", onEnableEvent);
    cubePointTracker.addEventListener("disable", onDisableEvent);
    return () => {
      cubePointTracker.removeEventListener("enable", onEnableEvent);
      cubePointTracker.removeEventListener("disable", onDisableEvent);
    };
  }, [onMouseUp, cubePointTracker, onFrameListeners, raycaster, modelerGumball]);
};
