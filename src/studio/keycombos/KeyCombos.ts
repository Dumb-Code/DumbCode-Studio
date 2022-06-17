import KeyCombo from "./KeyCombo";

const keyCombos = {
  common: {
    name: "COMMON SHORTCUT BINDINGS",
    desc: "Key bindings that apply all across the studio.",
    combos: {
      copy: new KeyCombo('Copy', "Copies the field value", 'KeyC'),
      paste: new KeyCombo('Paste', "Pastes the field value", 'KeyV'),
      undo: new KeyCombo('Undo', "Un does the last operation", 'KeyZ'),
      redo: new KeyCombo('Redo', "Re does the last undone operation", 'KeyY'),
      repeat_previous_command: new KeyCombo('Repeat Previous Command', "Repeats the last command run by the user", 'Space', false),
    }
  },

  camera_view: {
    name: "CAMERA VIEW BINDINGS",
    desc: "Key bindings that apply all across the studio.",
    combos: {
      front_view: new KeyCombo('Front View', "Moves the camera to view the Front of the model", 'Numpad5', false),
      back_view: new KeyCombo('Back View', "Moves the camera to view the Back of the model", 'Numpad5'),
      left_view: new KeyCombo('Left View', "Moves the camera to view the Left of the model", 'Numpad4'),
      right_view: new KeyCombo('Right View', "Moves the camera to view the Right of the model", 'Numpad6'),
      top_view: new KeyCombo('Top View', "Moves the camera to view the Top of the model", 'Numpad8'),
      bottom_view: new KeyCombo('Bottom View', "Moves the camera to view the Bottom of the model", 'Numpad2'),
    }
  },

  camera_rotation: {
    name: "CAMERA ROTATION BINDINGS",
    desc: "Key bindings that apply all across the studio.",
    combos: {
      rotate_view_left: new KeyCombo('Rotate View Left', "Rotates the camera slightly Left", 'Numpad4', false),
      rotate_view_right: new KeyCombo('Rotate View Right', "Rotates the camera slightly Right", 'Numpad6', false),
      rotate_view_up: new KeyCombo('Rotate View Up', "Rotates the camera slightly Up", 'Numpad8', false),
      rotate_view_down: new KeyCombo('Rotate View Down', "Rotates the camera slightly Down", 'Numpad2', false),
    }
  },

  modeler: {
    name: "MODELER BINDINGS",
    desc: "Key bindings that apply to the modeler.",
    scoped: true,
    combos: {
      copy_only_selected: new KeyCombo('Copy No Children', "Copy only the selected cubes (no children)", "KeyC", true, true),
      paste_world_position: new KeyCombo('Paste as World', "Paste the cubes in the world position they were copied from", "KeyV", true, true),
      delete: new KeyCombo('Delete', "Deletes the selected object.", 'Delete', false),
      delete_and_children: new KeyCombo('Delete + Children', "Deletes the selected object and it's children.", 'Delete'),
    }
  },

  animator: {
    name: "ANIMATOR BINDINGS",
    desc: "Key bindings that apply to the animator.",
    scoped: true,
    combos: {
      delete: new KeyCombo('Delete', "Deletes the selected keyframe.", 'Delete', false),
      paste_keyframes_defined: new KeyCombo('Paste as defined', "Pasted the keyframes in defined mode", "KeyV", true, true),
      individually_select: new KeyCombo('Individually Select', "Invividually select the keyframe", null),
    }
  },
}

type KeyComboMapSchema = {
  [category: string]: {
    name: string,
    desc: string,
    scoped?: boolean,
    combos: {
      [key: string]: KeyCombo
    }
  }
}
const stronglyTypedKeyCombo: KeyComboMapSchema = keyCombos

for (const key of Object.keys(keyCombos)) {
  const category = stronglyTypedKeyCombo[key]
  if (category.scoped) {
    for (const kb of Object.keys(category.combos)) {
      category.combos[kb].withScope(key)
    }
  }
}

export const loadOrCreateKeyCombos = (savedCombos: SavedKeyComboMap | undefined): KeyComboMap => {
  if (savedCombos !== undefined) {
    Object.keys(keyCombos).forEach(k => {
      const key = k as KeyComboCategory
      if (savedCombos[key] !== undefined) {
        for (const kck of Object.keys(keyCombos[key])) {
          stronglyTypedKeyCombo[key].combos[kck].copyFrom(savedCombos[key][kck as KeyComboKey<typeof key>])
        }
      }
    })
  }
  updateClashes(keyCombos)
  return keyCombos
}

export const updateClashes = (map: KeyComboMap) => {
  const allCombos = Object.keys(map).flatMap(category => Object.values(map[category as KeyComboCategory].combos))
  allCombos.forEach(combo => updateToAllClashes(combo, allCombos))
}

const updateToAllClashes = (keyCombo: KeyCombo, combokeys: KeyCombo[]) => {
  keyCombo.clashedWith.value = combokeys.filter(other => keyCombo.sharesScope(other) && (keyCombo.equals(other) || other.equals(keyCombo)))
}

export type KeyComboMap = typeof keyCombos
export type KeyComboCategory = keyof KeyComboMap
export type KeyComboKey<V extends KeyComboCategory> = keyof KeyComboMap[V]['combos']


export type SavedKeyCombo = {
  code: string | null, ctrl: boolean, shift: boolean, alt: boolean
}
export type SavedKeyComboMap = {
  [key: string]: {
    [combo: string]: SavedKeyCombo
  }
}