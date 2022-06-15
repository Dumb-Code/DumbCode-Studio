import { ParsedKeyframeType } from './../formats/animations/DCALoader';

type ClipboardType = "keyframe"
type ClipboardDataTypes<T extends ClipboardType> =
  T extends "keyframe" ? ParsedKeyframeType :
  never

type LocalStorageClipboardType<T extends ClipboardType> = {
  type: T;
  objects: ClipboardDataTypes<T>[];
}

const storageKey = "faux_clipboard"

export const writeToClipboard = <T extends ClipboardType>(type: T, objects: ClipboardDataTypes<T>[]) => {
  const stored: LocalStorageClipboardType<T> = { type, objects }
  localStorage.setItem(storageKey, JSON.stringify(stored))
}

export const readFromClipboard = <T extends ClipboardType>(type: T): ClipboardDataTypes<T>[] | null => {
  const item = localStorage.getItem(storageKey)
  if (item === null) {
    return null
  }
  const parsed = JSON.parse(item) as LocalStorageClipboardType<T>
  if (parsed.type === type) {
    return parsed.objects
  }
  return null
}