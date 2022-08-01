import type { ThreeJsContext } from './../../contexts/ThreeContext';
const UnsafeOperations = {

  //Set in DialogBoxes
  _unsafe_setDialogBox: (val: () => JSX.Element): void => {
    throw new Error("_unsafe_setDialogBox is not set")
  },

  //Set in ReferenceImageDialogBox.ts
  _unsafe_OpenReferenceImage: (): void => {
    throw new Error("_unsafe_OpenReferenceImage has not been set")
  },

  //Set in StudioContext
  _unsafe_getThreeContext: (): ThreeJsContext => {
    throw new Error("_unsafe_getThreeContext has not been set");
  }
}

export default UnsafeOperations