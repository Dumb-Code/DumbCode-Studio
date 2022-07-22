import { useEffect, useRef } from 'react';
import { useOptions } from '../../contexts/OptionsContext';
import { useStudio } from '../../contexts/StudioContext';
import { writeDcProj } from '../formats/project/DcProjectLoader';
import AutoRecoveryFileSystem from './AutoRecoveryFileSystem';


//This is where the actual auto recovery saving happens.
export const useAutoRecovery = () => {
  const { hasProject, getSelectedProject } = useStudio()

  const { autoRecoveryEnabled, autoRecoverySaveTime } = useOptions()

  const timeSinceLastSave = useRef(Date.now())

  useEffect(() => {
    if (!hasProject || !autoRecoveryEnabled) {
      return
    }
    const project = getSelectedProject()

    const performWrite = async (blob: Blob, now: number) => {
      try {
        await AutoRecoveryFileSystem.writeFile(`${now}-${project.name.value}`, blob)
      } catch (e) {
        console.warn(e)
        //We've run out of space.
        await AutoRecoveryFileSystem.deleteOldest()
        // await performWrite(blob, now)
      }
    }

    //We do the auto recovery listening when the mouse moves,
    //or a key is pressed, so that if the user is afk and makes no changes,
    //Their autosave history is not filled up
    const checkAutoRecovery = async () => {
      const now = Date.now()
      //autoRecoverySaveTime is in minutes, so we need to convert to ms
      if (now - timeSinceLastSave.current > autoRecoverySaveTime * 60000) {
        timeSinceLastSave.current = now

        const blob = await writeDcProj(project)
        await performWrite(blob, now)
      }
    }
    document.addEventListener("mousemove", checkAutoRecovery)
    document.addEventListener("keydown", checkAutoRecovery)
    return () => {
      document.removeEventListener("mousemove", checkAutoRecovery)
      document.removeEventListener("keydown", checkAutoRecovery)
    }

  }, [hasProject, getSelectedProject, autoRecoveryEnabled, autoRecoverySaveTime])

}