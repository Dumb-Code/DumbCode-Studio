import { useCallback, useEffect, useRef } from 'react';
import { Event, Quaternion, Vector3 } from 'three';
import { useStudio } from '../../../contexts/StudioContext';
import { DCMCube } from '../../../studio/formats/model/DcmModel';
import { useListenableObject } from '../../../studio/listenableobject/ListenableObject';
import { HistoryActionTypes } from '../../../studio/undoredo/UndoRedoHandler';
import { LockerType } from '../../../studio/util/CubeLocker';
import { alignAxis, decomposeEuler, decomposePosition, decomposePosition2, decomposeRotation, decomposeRotation2, decomposeScale, decomposeScale2, StartingCacheData, _identityMatrix } from './ModelerGumball';


export const useModelerGumball = () => {
  const { getSelectedProject, transformControls } = useStudio();
  const { selectedCubeManager, modelerGumball: gumball, model, cubePointTracker, referenceImageHandler } = getSelectedProject();

  const getCubes = useCallback((selected: readonly string[] = selectedCubeManager.selected.value) => {
    return selected.map(cube => model.identifierCubeMap.get(cube)).filter(c => c !== undefined) as readonly DCMCube[];
  }, [selectedCubeManager, model.identifierCubeMap]);

  const selectedCubes = useRef<readonly DCMCube[]>([]);

  const [selectedImage] = useListenableObject(referenceImageHandler.selectedImage);

  useEffect(() => {
    if (selectedImage !== null) {
      return;
    }
    //TODO: move the callbacks to the ModelerGumball class
    const updateObjectMode = ({
      mode = gumball.object_transformMode.value, space = gumball.space.value,
    }) => {
      switch (mode) {
        case "translate":
        case "rotate":
          transformControls.space = space;
          break;
        case "dimensions":
          transformControls.space = "local";
          break;
        default:
          return;
      }
      transformControls.mode = mode as any;
    };

    const updateTransformControlsVisability = ({ enabled = gumball.enabled.value, blockedReasons = gumball.blockedReasons.value, gumballMode = gumball.mode.value }) => {
      const visible = enabled && (gumballMode === "gumball" || selectedCubes.current.length !== 0);
      transformControls.visible = visible;
      transformControls.enabled = visible && blockedReasons.length === 0;
    };

    const enableDisableCallback = (enabled: boolean) => {
      updateTransformControlsVisability({ enabled });
    };

    const updateBlockedReasons = (reasons: readonly string[]) => {
      updateTransformControlsVisability({ blockedReasons: reasons });
    };

    const changeModeCallback = (val = gumball.mode.value) => {
      if (val === "object") {
        updateObjectMode({});
      } else { //val === "gumall"
        transformControls.space = gumball.space.value;
        transformControls.mode = gumball.gumball_move_mode.value;
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

    const onCubeValuesChange = () => {
      if (gumball.gumball_auto_move) {
        getCubes().forEach(c => c.updateMatrixWorld(true));
        gumball.moveGumballToSelected({});
      }
    };

    const updateSelectedCubes = (val: readonly string[]) => {
      selectedCubes.current.forEach(cube => {
        cube.position.removePostListener(onCubeValuesChange);
        cube.rotation.removePostListener(onCubeValuesChange);
      });
      onCubeValuesChange();
      selectedCubes.current = getCubes(val);
      selectedCubes.current.forEach(cube => {
        cube.position.addPostListener(onCubeValuesChange);
        cube.rotation.addPostListener(onCubeValuesChange);
      });
      gumball.transformAnchor.userData.dcmCube = selectedCubes.current.length === 1 ? selectedCubes.current[0] : undefined;
      if (gumball.gumball_auto_move.value) {
        gumball.moveGumballToSelected({ selected: val });
      }
      updateTransformControlsVisability({});
    };
    const moveWhenAutomove = (automove: boolean) => {
      if (automove) {
        gumball.moveGumballToSelected({});
      }
    };

    const changeGumballMode = (val = gumball.gumball_move_mode.value) => transformControls.mode = val;



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
        const elem = gumball.getThreeObject(cube);

        (elem.parent?.matrixWorld ?? _identityMatrix).decompose(decomposePosition2, decomposeRotation2, decomposeScale2);
        const axis = axisIn.clone();
        if (space === 'local') {
          axis.applyQuaternion(decomposeRotation);
        }
        axis.applyQuaternion(decomposeRotation2.invert());
        callback(axis, cube, data);
      });
    };

    //When the mouse is pressed down on the transform controls
    const mouseDownTransformControls = runWhenObjectSelected(() => {
      model.undoRedoHandler.startBatchActions();
      const rotationPoint = gumball.object_transformMode.value === "translate" && gumball.object_position_type.value === 'rotation_point';
      if (rotationPoint) {
        model.lockedCubes.clearCubeLockers();
      } else {
        model.lockedCubes.createLockedCubesCache();
      }
      gumball.startingCache.clear();
      getCubes().forEach(cube => {
        //If rotation point, then create a cube locker for the cube's offset and children
        if (rotationPoint) {
          model.lockedCubes.addToLocker(cube, LockerType.OFFSET);
          cube.children.value.forEach(child => model.lockedCubes.addToLocker(child, LockerType.POSITION));
        }

        const elem = gumball.getThreeObject(cube);

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
          position: cube.position.value,
          offset: cube.offset.value,
          dimension: cube.dimension.value,
          quaternion: elem.quaternion.clone(),
          threeWorldPos: elem.getWorldPosition(elem.position.clone())
        });
      });
    });
    const onMouseUpTransformControls = runWhenObjectSelected(() => {
      model.lockedCubes.clearCubeLockers();
      model.undoRedoHandler.endBatchActions("Gumball Move", HistoryActionTypes.Transformation);
    });
    const onObjectChangeReconstruct = runWhenObjectSelected(() => model.lockedCubes.reconstructLockedCubes());

    //The translate event
    type TranslateEvent = { type: string; length: number; parentQuaternionInv: Quaternion; axis: Vector3; };
    const translateEventTransformControls = runWhenObjectSelected((evt: Event) => {
      const e = evt as TranslateEvent;
      forEachCube(e.axis, true, gumball.space.value, (axis, cube, data) => {
        axis.multiplyScalar(e.length);
        let pos = axis.toArray();
        switch (gumball.object_position_type.value) {
          case 'offset':
            if (!cube.locked.value) {
              cube.offset.value = [
                pos[0] + data.offset[0],
                pos[1] + data.offset[1],
                pos[2] + data.offset[2],
              ];
            }
            break;
          case 'rotation_point':
          case 'position':
            cube.position.value = [
              pos[0] + data.position[0],
              pos[1] + data.position[1],
              pos[2] + data.position[2],
            ];
            cube.cubeGroup.updateMatrixWorld(true);
            break;
        }
      });
    });

    //The rotate event
    type RotateEvent = { type: string; rotationAxis: Vector3; rotationAngle: number; parentQuaternionInv: Quaternion; };
    const rotateEventTransformControls = runWhenObjectSelected((evt: Event) => {
      const e = evt as RotateEvent;
      forEachCube(e.rotationAxis, true, gumball.space.value, (axis, cube, data) => {
        decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle);
        decomposeRotation2.multiply(data.quaternion).normalize();

        decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX");
        cube.rotation.value = [
          decomposeEuler.x * 180 / Math.PI,
          decomposeEuler.y * 180 / Math.PI,
          decomposeEuler.z * 180 / Math.PI
        ];

        if (gumball.object_rotation_type.value === "rotation_around_point") {
          const diff = decomposePosition.copy(data.threeWorldPos).sub(gumball.transformAnchor.position).multiply(decomposePosition2.set(16, 16, 16));
          const rotatedPos = decomposePosition2.copy(diff).applyAxisAngle(axis, e.rotationAngle);
          const rotatedDiff = rotatedPos.sub(diff);
          cube.position.value = [
            rotatedDiff.x + data.position[0],
            rotatedDiff.y + data.position[1],
            rotatedDiff.z + data.position[2]
          ];
        }
      });
    });

    //The dimension event
    type DimensionEvent = { type: string; length: number; axis: Vector3; };
    const dimensionEventTransformControls = runWhenObjectSelected((evt: Event) => {
      const e = evt as DimensionEvent;
      let length = Math.floor(e.length * 16);
      forEachCube(e.axis, false, "local", (axis, cube, data) => {
        let len = [length, length, length];
        alignAxis(axis);
        const getDimension = (i: number) => {
          let ret = Math.abs(axis.getComponent(i)) * length + data.dimension[i];
          if (ret < 0) {
            len[i] = -data.dimension[i] / Math.abs(axis.getComponent(i));
            ret = 0;
          }
          return ret;
        };
        cube.dimension.value = [getDimension(0), getDimension(1), getDimension(2)];
        if (e.axis.x + e.axis.y + e.axis.z < 0) {
          cube.offset.value = [
            e.axis.x * len[0] + data.offset[0],
            e.axis.y * len[1] + data.offset[1],
            e.axis.z * len[2] + data.offset[2],
          ];
        }
      });
    });

    //This will cause `visible` to be true, but the `enableDisableCallback` will force it to be the right value
    transformControls.attach(gumball.transformAnchor);
    transformControls.addEventListener("mouseDown", mouseDownTransformControls);
    transformControls.addEventListener("mouseUp", onMouseUpTransformControls);
    transformControls.addEventListener("objectChange", onObjectChangeReconstruct);
    transformControls.addEventListener("studioTranslate", translateEventTransformControls);
    transformControls.addEventListener("studioRotate", rotateEventTransformControls);
    transformControls.addEventListener("studioDimension", dimensionEventTransformControls);

    gumball.enabled.addAndRunListener(enableDisableCallback);
    gumball.blockedReasons.addAndRunListener(updateBlockedReasons);
    gumball.mode.addAndRunListener(changeModeCallback);
    gumball.object_transformMode.addAndRunListener(changeObjectTransformMode);
    gumball.gumball_move_mode.addAndRunListener(changeGumballMode);
    gumball.space.addAndRunListener(changeGumballSpace);
    gumball.gumball_auto_move.addListener(moveWhenAutomove);
    selectedCubeManager.selected.addAndRunListener(updateSelectedCubes);
    return () => {
      transformControls.detach();
      transformControls.removeEventListener("mouseDown", mouseDownTransformControls);
      transformControls.removeEventListener("mouseUp", onMouseUpTransformControls);
      transformControls.removeEventListener("objectChange", onObjectChangeReconstruct);
      transformControls.removeEventListener("studioTranslate", translateEventTransformControls);
      transformControls.removeEventListener("studioRotate", rotateEventTransformControls);
      transformControls.removeEventListener("studioDimension", dimensionEventTransformControls);

      gumball.enabled.removeListener(enableDisableCallback);
      gumball.blockedReasons.removeListener(updateBlockedReasons);
      gumball.mode.removeListener(changeModeCallback);
      gumball.object_transformMode.removeListener(changeObjectTransformMode);
      gumball.gumball_move_mode.removeListener(changeGumballMode);
      gumball.space.removeListener(changeGumballSpace);
      selectedCubeManager.selected.removeListener(updateSelectedCubes);
      gumball.gumball_auto_move.removeListener(moveWhenAutomove);
    };
  }, [getCubes, model, gumball, selectedCubeManager.selected, transformControls, cubePointTracker, selectedImage]);

};
