import type { ThreeJsContext } from './../../contexts/ThreeContext';
const UnsafeOperations = {

  //Both set in DialogBoxes
  _unsafe_setDialogBox: (val: () => JSX.Element): void => {
    throw new Error("_unsafe_setDialogBox is not set")
  },
  _unsafe_OpenReferenceImage: (): void => {
    throw new Error("_unsafe_OpenReferenceImage has not been set")
  },

  //Both set in StudioContext
  _unsafe_hasThreeContext: () => false,
  _unsafe_getThreeContext: (): ThreeJsContext => {
    throw new Error("_unsafe_getThreeContext has not been set");
  }
}

export default UnsafeOperations