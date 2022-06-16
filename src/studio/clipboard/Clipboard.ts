import { CubeClipboardType } from './CubeClipboardType';
import { KeyframeClipboardType } from './KeyframeClipboardType';

type ClipboardType = "keyframe" | "cube"
type ClipboardDataTypes<T extends ClipboardType> =
  T extends "keyframe" ? KeyframeClipboardType :
  T extends "cube" ? CubeClipboardType :
  never

type LocalStorageClipboardType<T extends ClipboardType> = {
  readonly type: T;
  readonly objects: readonly ClipboardDataTypes<T>[];
}

const storageKey = "faux_clipboard"

export const writeToClipboard = <T extends ClipboardType>(type: T, objects: readonly ClipboardDataTypes<T>[]) => {
  const stored: LocalStorageClipboardType<T> = { type, objects }
  localStorage.setItem(storageKey, JSON.stringify(stored))
}

export const readFromClipboard = <T extends ClipboardType>(type: T): readonly ClipboardDataTypes<T>[] | null => {
  const item = localStorage.getItem(storageKey)
  if (item === null) {
    return null
  }
  const parsed = JSON.parse(item) as LocalStorageClipboardType<T>
  if (parsed.type === type && parsed.objects.length !== 0) {
    return parsed.objects
  }
  return null
}