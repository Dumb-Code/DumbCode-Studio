import { useCallback, useEffect, useRef } from 'react';
import { Event, Quaternion, Vector3 } from 'three';
import { useStudio } from '../../../contexts/StudioContext';
import AnimatorGumballConsumer, { AnimatorGumballConsumerPart } from '../../../studio/formats/animations/AnimatorGumballConsumer';
import { DCMCube } from '../../../studio/formats/model/DcmModel';
import { HistoryActionTypes } from '../../../studio/undoredo/UndoRedoHandler';
import { decomposeEuler, decomposePosition, decomposePosition2, decomposeRotation, decomposeRotation2, decomposeScale, decomposeScale2, StartingCacheData, _identityMatrix } from './AnimatorGumball';


export const useAnimatorGumball = (consumer: AnimatorGumballConsumer | null) => {
  const { getSelectedProject, transformControls, onFrameListeners } = useStudio();
  const { selectedCubeManager, modelerGumball, model, cubePointTracker } = getSelectedProject();
  const gumballBlockedReasons = modelerGumball.blockedReasons;

  const getCubes = useCallback((selected: readonly string[] = selectedCubeManager.selected.value) => {
    return selected.map(cube => model.identifierCubeMap.get(cube)).filter(c => c !== undefined) as readonly DCMCube[];
  }, [selectedCubeManager, model.identifierCubeMap]);

  const selectedCubes = useRef<readonly DCMCube[]>([]);

  useEffect(() => {
    if (consumer === null) {
      return;
    }
    const animation = consumer;
    const ikAnchorCubes = () => animation.ikAnchorCubes.value;
    const ikDirection = () => animation.ikDirection.value;
    const undoRedoHandler = animation.getUndoRedoHandler();
    const gumball = animation.getAnimatorGumball();

    const selectedPart = animation.getSingleSelectedPart();

    const render = () => {
      animation.renderForGumball();
      // model.resetVisuals()
      // animation.animate(0)
    };

    //TODO: move the callbacks to the AnimatorGumball class
    const updateObjectMode = ({
      mode = gumball.object_transformMode.value, space = gumball.space.value,
    }) => {
      transformControls.space = space;

      switch (mode) {
        case "translateIK":
          transformControls.mode = "translate";
          transformControls.attach(gumball.gumballIK.anchor);
          gumball.gumballIK.begin(animation, selectedCubes.current, ikAnchorCubes(), ikDirection());
          break;
        default:
          transformControls.mode = mode;
          transformControls.attach(gumball.transformAnchor);
          gumball.gumballIK.end();
      }
    };

    const updateTransformControlsVisability = ({ enabled = gumball.enabled.value, blockedReasons = gumballBlockedReasons.value, gumballMode = gumball.mode.value, part = selectedPart.value }) => {
      const visible = enabled && (gumballMode === "gumball" || (selectedCubes.current.length !== 0 && part !== null));
      transformControls.visible = visible;
      transformControls.enabled = visible && blockedReasons.length === 0;
      if (visible) {
        updateObjectMode({});
      }
    };

    const enableDisableCallback = (enabled: boolean) => {
      updateTransformControlsVisability({ enabled });
    };

    const updateBlockedReasons = (reasons: readonly string[]) => {
      updateTransformControlsVisability({ blockedReasons: reasons });
    };

    const updateSelectedKeyframes = (part: AnimatorGumballConsumerPart | null) => {
      updateTransformControlsVisability({ part });
    };

    const changeModeCallback = (val = gumball.mode.value) => {
      if (val === "object") {
        updateObjectMode({});
      } else { //val === "gumall"
        transformControls.attach(gumball.transformAnchor);
        transformControls.space = gumball.space.value;
        transformControls.mode = "rotate";
        gumball.gumballIK.end();
      }
      updateTransformControlsVisability({ gumballMode: val });
    };

    const changeGumballSpace = (val = gumball.space.value) => {
      if (gumball.mode.value === "object") {
        updateObjectMode({ space: val });
      } else {
        transformControls.space = val;
      }
    };


    const changeObjectTransformMode = (val = gumball.object_transformMode.value) => updateObjectMode({ mode: val });

    const updateSelectedCubes = (val: readonly string[]) => {
      selectedCubes.current = getCubes(val);
      gumball.transformAnchor.userData.dcmCube = selectedCubes.current.length === 1 ? selectedCubes.current[0] : undefined;
      if (gumball.gumball_autoRotate.value) {
        gumball.moveToSelected(val);
      }
      if (gumball.mode.value === "object" && gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.begin(animation, selectedCubes.current, ikAnchorCubes(), ikDirection());
      }
      updateTransformControlsVisability({});
    };

    const updateIKAnchors = (val: readonly string[]) => {
      if (gumball.mode.value === "object" && gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.begin(animation, selectedCubes.current, val, ikDirection());
      }
    };
    const updateIKDirection = (direction: "upwards" | "downwards") => {
      if (gumball.mode.value === "object" && gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.begin(animation, selectedCubes.current, ikAnchorCubes(), direction);
      }
    };

    const moveOnFrame = () => {
      if (!transformControls.dragging) {
        gumball.moveToSelected();
      }

      render();
      gumball.gumballIK.updateHelpers();
    };


    //Below are the callbacks for the transform controls
    const runWhenObjectSelected = <T extends any[]>(func: (...args: T) => void) => (...args: T) => {
      if (gumball.mode.value === "object") {
        func(...args);
      }
    };

    //Runs callback with a transformed axis, the cube and any additional data.
    //Used for trasnform tools.
    const forEachCube = (axisIn: Vector3, applyRoots: boolean, space: "world" | "local", callback: (axis: Vector3, cube: DCMCube, data: StartingCacheData) => void) => {
      //decompose where the gumball is right now
      gumball.transformAnchor.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale);
      gumball.startingCache.forEach((data, cube) => {
        if (applyRoots === true && data.root !== true) {
          return;
        }
        const elem = cube.cubeGroup;

        (elem.parent?.matrixWorld ?? _identityMatrix).decompose(decomposePosition2, decomposeRotation2, decomposeScale2);
        const axis = axisIn.clone();
        if (space === 'local') {
          axis.applyQuaternion(decomposeRotation);
        }
        axis.applyQuaternion(decomposeRotation2.invert());
        callback(axis, cube, data);
      });
    };

    const objectChangeReconstructIK = runWhenObjectSelected(() => {
      const selectedKfs = animation.getSingleSelectedPart().value;
      if (selectedKfs === null) {
        return;
      }
      if (gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.objectChange(animation, selectedKfs, selectedCubes.current);
      }
    });
    const mouseDownTransformControls = runWhenObjectSelected(() => {
      undoRedoHandler?.startBatchActions();
      const selectedKfs = animation.getSingleSelectedPart().value;
      if (selectedKfs === null) {
        return;
      }
      const kf = selectedKfs;
      const cubes = selectedCubes.current;
      if (gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.begin(animation, selectedCubes.current, ikAnchorCubes(), ikDirection());

        return;
      }

      render();

      gumball.startingCache.clear();
      cubes.forEach(cube => {
        const elem = cube.cubeGroup;

        let parent = cube.parent;
        //Only move the cubes that don't have a parent moving too.
        let root = true;
        while (parent instanceof DCMCube) {
          if (parent.selected.value) {
            root = false;
            break;
          }
          parent = parent.parent;
        }
        gumball.startingCache.set(cube, {
          root: root,
          position: kf.gumballGetPosition(cube) ?? [0, 0, 0],
          quaternion: elem.quaternion.clone()
        });
      });
    });
    const onMouseUpTransformControls = runWhenObjectSelected(() => {
      undoRedoHandler?.endBatchActions("Gumball Move", HistoryActionTypes.Transformation);
    });

    //The translate event
    type TranslateEvent = { type: string; length: number; parentQuaternionInv: Quaternion; axis: Vector3; };
    const translateEventTransformControls = runWhenObjectSelected((evt: Event) => {
      if (gumball.object_transformMode.value === "translateIK") {
        return;
      }
      const selectedKfs = animation.getSingleSelectedPart().value;
      if (selectedKfs === null) {
        return;
      }
      const kf = selectedKfs;
      const e = evt as TranslateEvent;
      forEachCube(e.axis, true, gumball.space.value, (axis, cube, data) => {
        axis.multiplyScalar(e.length);
        let pos = axis.toArray();
        const position = [
          pos[0] + data.position[0],
          pos[1] + data.position[1],
          pos[2] + data.position[2],
        ] as const;
        kf.gumballSetPosition(cube, position);
        cube.updatePositionVisuals(position);
        cube.updateMatrixWorld();
      });
    });

    //The rotate event
    type RotateEvent = { type: string; rotationAxis: Vector3; rotationAngle: number; parentQuaternionInv: Quaternion; };
    const rotateEventTransformControls = runWhenObjectSelected((evt: Event) => {
      if (gumball.object_transformMode.value === "translateIK") {
        return;
      }
      const selectedKfs = animation.getSingleSelectedPart().value;
      if (selectedKfs === null) {
        return;
      }
      const kf = selectedKfs;
      const e = evt as RotateEvent;
      forEachCube(e.rotationAxis, true, gumball.space.value, (axis, cube, data) => {
        decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle);
        decomposeRotation2.multiply(data.quaternion).normalize();

        decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX");
        const rotation = [
          decomposeEuler.x * 180 / Math.PI,
          decomposeEuler.y * 180 / Math.PI,
          decomposeEuler.z * 180 / Math.PI
        ] as const;
        kf.gumballSetRotation(cube, rotation);
        cube.updateRotationVisuals(rotation);
        cube.updateMatrixWorld();
      });
    });

    //This will cause `visible` to be true, but the `enableDisableCallback` will force it to be the right value
    transformControls.attach(gumball.transformAnchor);
    transformControls.addEventListener("mouseDown", mouseDownTransformControls);
    transformControls.addEventListener("mouseUp", onMouseUpTransformControls);
    transformControls.addEventListener("objectChange", objectChangeReconstructIK);
    transformControls.addEventListener("studioTranslate", translateEventTransformControls);
    transformControls.addEventListener("studioRotate", rotateEventTransformControls);

    gumball.enabled.addAndRunListener(enableDisableCallback);
    gumballBlockedReasons.addAndRunListener(updateBlockedReasons);
    gumball.mode.addAndRunListener(changeModeCallback);
    gumball.object_transformMode.addAndRunListener(changeObjectTransformMode);
    gumball.space.addAndRunListener(changeGumballSpace);

    onFrameListeners.add(moveOnFrame);
    selectedCubeManager.selected.addAndRunListener(updateSelectedCubes);
    selectedPart.addListener(updateSelectedKeyframes);
    animation.ikAnchorCubes.addListener(updateIKAnchors);
    animation.ikDirection.addListener(updateIKDirection);

    return () => {
      transformControls.detach();
      transformControls.removeEventListener("mouseDown", mouseDownTransformControls);
      transformControls.removeEventListener("mouseUp", onMouseUpTransformControls);
      transformControls.removeEventListener("objectChange", objectChangeReconstructIK);
      transformControls.removeEventListener("studioTranslate", translateEventTransformControls);
      transformControls.removeEventListener("studioRotate", rotateEventTransformControls);

      gumball.enabled.removeListener(enableDisableCallback);
      gumballBlockedReasons.removeListener(updateBlockedReasons);
      gumball.mode.removeListener(changeModeCallback);
      gumball.object_transformMode.removeListener(changeObjectTransformMode);
      gumball.space.removeListener(changeGumballSpace);

      onFrameListeners.delete(moveOnFrame);
      selectedCubeManager.selected.removeListener(updateSelectedCubes);
      selectedPart.removeListener(updateSelectedKeyframes);
      animation.ikAnchorCubes.removeListener(updateIKAnchors);
      animation.ikDirection.removeListener(updateIKDirection);

      gumball.gumballIK.end();

    };
  }, [getCubes, model, selectedCubeManager.selected, transformControls, cubePointTracker, consumer, gumballBlockedReasons, onFrameListeners]);

};
