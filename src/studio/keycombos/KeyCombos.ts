import KeyCombo from "./KeyCombo";
const keyCombos = {
  common_copy: new KeyCombo('Copy', "Copies the field value", 'KeyC'),
  common_paste: new KeyCombo('Paste', "Pastes the field value", 'KeyV'),
  common_undo: new KeyCombo('Undo', "Un does the last operation", 'KeyZ'),
  common_redo: new KeyCombo('Redo', "Re does the last undone operation", 'KeyY'),
  common_repeat_previous_command: new KeyCombo('Repeat Previous Command', "Repeats the last command run by the user", 'Space', false),
  camera_view_front_view: new KeyCombo('Front View', "Moves the camera to view the Front of the model", 'Numpad5', false),
  camera_view_back_view: new KeyCombo('Back View', "Moves the camera to view the Back of the model", 'Numpad5'),
  camera_view_left_view: new KeyCombo('Left View', "Moves the camera to view the Left of the model", 'Numpad4'),
  camera_view_right_view: new KeyCombo('Right View', "Moves the camera to view the Right of the model", 'Numpad6'),
  camera_view_top_view: new KeyCombo('Top View', "Moves the camera to view the Top of the model", 'Numpad8'),
  camera_view_bottom_view: new KeyCombo('Bottom View', "Moves the camera to view the Bottom of the model", 'Numpad2'),
  camera_rotation_rotate_view_left: new KeyCombo('Rotate View Left', "Rotates the camera slightly Left", 'Numpad4', false),
  camera_rotation_rotate_view_right: new KeyCombo('Rotate View Right', "Rotates the camera slightly Right", 'Numpad6', false),
  camera_rotation_rotate_view_up: new KeyCombo('Rotate View Up', "Rotates the camera slightly Up", 'Numpad8', false),
  camera_rotation_rotate_view_down: new KeyCombo('Rotate View Down', "Rotates the camera slightly Down", 'Numpad2', false),
  modeler_delete: new KeyCombo('Delete', "Deletes the selected object.", 'Delete', false).withScope("modeler"),
  modeler_delete_and_children: new KeyCombo('Delete + Children', "Deletes the selected object and it's children.", 'Delete').withScope("modeler"),
  animator_delete: new KeyCombo('Delete', "Deletes the selected keyframe.", 'Delete', false).withScope("animator"),
  animator_individually_select: new KeyCombo('Individually Select', "Invividually select the keyframe", null).withScope("animator"), //Only Ctrl
}

export const loadOrCreateKeyCombos = (savedCombos: SavedKeyComboMap | undefined): KeyComboMap => {
  if (savedCombos !== undefined) {
    Object.keys(keyCombos).forEach(k => {
      const key = k as KeyComboKey
      if (savedCombos[key] !== undefined) {
        keyCombos[key].copyFrom(savedCombos[key])
      }
    })
  }
  updateClashes(keyCombos)
  return keyCombos
}

export const updateClashes = (map: KeyComboMap) => {
  const allCombos = Object.keys(map).map(k => map[k as KeyComboKey])
  allCombos.forEach(combo => updateToAllClashes(combo, allCombos))
}

const updateToAllClashes = (keyCombo: KeyCombo, combokeys: KeyCombo[]) => {
  keyCombo.clashedWith.value = combokeys.filter(other => keyCombo.sharesScope(other) && (keyCombo.equals(other) || other.equals(keyCombo)))
}

export type KeyComboMap = typeof keyCombos
export type KeyComboKey = keyof KeyComboMap

export type SavedKeyCombo = {
  code: string | null, ctrl: boolean, shift: boolean, alt: boolean
}
export type SavedKeyComboMap = {
  [key in KeyComboKey]: SavedKeyCombo
}

