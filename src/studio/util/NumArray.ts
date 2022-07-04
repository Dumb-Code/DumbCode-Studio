import { Matrix4Tuple } from 'three';

export type NumArray<V extends 2 | 3 | 4 | 16> =
  V extends 2 ? readonly [number, number] :
  V extends 3 ? readonly [number, number, number] :
  V extends 4 ? readonly [number, number, number, number] :
  V extends 16 ? Readonly<Matrix4Tuple> : never;
