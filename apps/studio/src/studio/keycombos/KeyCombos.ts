import KeyCombo from "./KeyCombo";

enum Scope {
  GLOBAL,
  THIS_AND_GLOBAL,
  THIS
}
const keyCombos = {
  common: {
    name: "Common Shortcut Bindings",
    desc: "Key bindings that apply all across the studio.",
    combos: {
      copy: new KeyCombo('Copy', "Copies the field value", 'KeyC'),
      paste: new KeyCombo('Paste', "Pastes the field value", 'KeyV'),
      undo: new KeyCombo('Undo', "Un does the last operation", 'KeyZ'),
      redo: new KeyCombo('Redo', "Re does the last undone operation", 'KeyY'),
      repeat_previous_command: new KeyCombo('Repeat Previous Command', "Repeats the last command run by the user", 'Space', false),
      screenshot: new KeyCombo('Screenshot', "Captures a screenshot of the current view", 'F2', false),
      screenshot_only_model: new KeyCombo('Screenshot Only The Model', "Captures a screenshot of only the current model", 'F2', true),
    }
  },

  scroll_and_zoom: {
    name: "Scroll and Zoom",
    desc: "Key bindings for scrolling and zooming. Applied to texture maps, progression points and the keyframe board.",
    additionalKey: "Mouse Wheel",
    scope: Scope.THIS,
    canBeNothing: true,
    canIncludeCodes: false,
    combos: {
      vertical_scroll: new KeyCombo('Vertical Scroll', "Scrolls the view vertically", null, false),
      horizontal_scroll: new KeyCombo('Horizontal Scroll', "Scrolls the view horizontally", null),
      zoom: new KeyCombo('Zoom', "Zooms the view", null, false, false, true),
    }
  },

  input_multipliers: {
    name: "Input Multipliers",
    desc: "Key bindings that apply when editing an input field.",
    scope: Scope.THIS,
    canBeNothing: true,
    canIncludeCodes: false,
    combos: {
      multiply_0_01: new KeyCombo('×0.01', "Multiplies the input by 0.01", null, true, false),
      multiply_0_1: new KeyCombo('×0.1', "Multiplies the input by 0.1", null, false, false),
      multiply_1: new KeyCombo('×1', "Multiplies the input by 1", null, false, true),
      multiply_10: new KeyCombo('×10', "Multiplies the input by 10", null, true, true),
    }
  },

  camera_view: {
    name: "Camera View Bindings",
    desc: "Key bindings that apply all across the studio.",
    combos: {
      front_view: new KeyCombo('Front View', "Moves the camera to view the Front of the model", 'Numpad5', false),
      back_view: new KeyCombo('Back View', "Moves the camera to view the Back of the model", 'Numpad5'),
      left_view: new KeyCombo('Left View', "Moves the camera to view the Left of the model", 'Numpad4'),
      right_view: new KeyCombo('Right View', "Moves the camera to view the Right of the model", 'Numpad6'),
      top_view: new KeyCombo('Top View', "Moves the camera to view the Top of the model", 'Numpad8'),
      bottom_view: new KeyCombo('Bottom View', "Moves the camera to view the Bottom of the model", 'Numpad2'),
      reset_camera_on_click: new KeyCombo('Reset Camera on Click', "Resets the camera to the model's center when a directional cubes face is clicked", null, true).setOnSpecificUnknownEvent("camera_cube_click")
    }
  },

  camera_rotation: {
    name: "Camera Rotation Bindings",
    desc: "Key bindings that apply all across the studio.",
    combos: {
      rotate_view_left: new KeyCombo('Rotate View Left', "Rotates the camera slightly Left", 'Numpad4', false),
      rotate_view_right: new KeyCombo('Rotate View Right', "Rotates the camera slightly Right", 'Numpad6', false),
      rotate_view_up: new KeyCombo('Rotate View Up', "Rotates the camera slightly Up", 'Numpad8', false),
      rotate_view_down: new KeyCombo('Rotate View Down', "Rotates the camera slightly Down", 'Numpad2', false),
    }
  },

  modeler: {
    name: "Modeler Bindings",
    desc: "Key bindings that apply to the modeler.",
    scope: Scope.THIS_AND_GLOBAL,
    combos: {
      delete: new KeyCombo('Delete', "Deletes the selected object.", 'Delete', false),
      delete_and_children: new KeyCombo('Delete + Children', "Deletes the selected object and it's children.", 'Delete'),
      copy_only_selected: new KeyCombo('Copy No Children', "Copy only the selected cubes (no children)", "KeyC", true, true),
      paste_world_position: new KeyCombo('Paste as World', "Paste the cubes in the world position they were copied from", "KeyV", true, true),

      drag_cube_only: new KeyCombo('Drag Cube Only', "In the cube list, dragging cubes will not move their children", null, true)
        .setOnSpecificUnknownEvent("cube_list_drag"),
      drag_cubes_locally: new KeyCombo('Drag Cubes Locally', "In the cube list, dragging cubes will preserve their local movements, but change their global transform ", null, false, false, true)
        .setOnSpecificUnknownEvent("cube_list_drag"),

      cube_list_apply_to_selected: new KeyCombo('Apply cube list action to selected', "Applies the action (visibility/locked) to the selected cubes", null, true)
        .setOnSpecificUnknownEvent("cube_list_action_selected"),
      cube_list_apply_to_children: new KeyCombo('Apply cube list action to children', "Applies the action (visibility/locked) to the selected cubes and their children recursivly.", null, false, true)
        .setOnSpecificUnknownEvent("cube_list_action_children"),
    }
  },

  animator: {
    name: "Animator Bindings",
    desc: "Key bindings that apply to the animator.",
    scope: Scope.THIS_AND_GLOBAL,
    combos: {
      delete: new KeyCombo('Delete', "Deletes the selected keyframes.", 'Delete', false),
      delete_layer: new KeyCombo('Delete layer', "Deletes the selected keyframe(s) layer(s).", 'Delete'),
      paste_keyframes_defined: new KeyCombo('Paste as defined', "Pasted the keyframes in defined mode", "KeyV", true, true),
      individually_select: new KeyCombo('Individually Select', "Invividually select the keyframe", null),

      pause_or_play: new KeyCombo('Pause/Play', "Pause or play the animation", 'Space', false),
      restart_animation: new KeyCombo('Restart Animation', "Restart the animation", 'Space', true),
      stop_animation: new KeyCombo('Stop Animation', "Stop the animation", 'Space', false, true),
    }
  },
}


type KeyComboMapSchema = {
  [category: string]: {
    name: string,
    desc: string,
    scope?: Scope,
    canBeNothing?: boolean,
    canIncludeCodes?: boolean,
    additionalKey?: string,
    combos: {
      [key: string]: KeyCombo
    }
  }
}
const stronglyTypedKeyCombo: KeyComboMapSchema = keyCombos

function getScopeListFromCategory(key: string, category: KeyComboMapSchema[string]) {
  const scope = category.scope ?? Scope.GLOBAL
  switch (scope) {
    case Scope.GLOBAL:
      return ["global"]
    case Scope.THIS:
      return [key]
    case Scope.THIS_AND_GLOBAL:
      return ["global", key]
  }
}

for (const key of Object.keys(keyCombos)) {
  const category = stronglyTypedKeyCombo[key]
  const scopes = getScopeListFromCategory(key, category)
  for (const kb of Object.keys(category.combos)) {
    const combo = category.combos[kb]
    if (!combo.shouldInferProperties()) {
      continue
    }
    combo.withScopes(scopes).setScope(key)
    if (category.canBeNothing !== undefined) {
      combo.setCanBeNothing(category.canBeNothing)
    }
    if (category.canIncludeCodes !== undefined) {
      combo.setCanIncludeCodes(category.canIncludeCodes)
    }
    if (category.additionalKey !== undefined) {
      combo.setAdditionalKey(category.additionalKey)
    }
  }
}

export const loadOrCreateKeyCombos = (savedCombos: SavedKeyComboMap | undefined): KeyComboMap => {
  if (savedCombos !== undefined) {
    Object.keys(keyCombos).forEach(k => {
      const key = k as KeyComboCategory
      if (savedCombos[key] !== undefined) {
        for (const kck of Object.keys(keyCombos[key].combos)) {
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

export const unsafe_getKeyCombos = () => keyCombos
export const unsafe_getKeyComboCategories = () => Object.keys(keyCombos) as KeyComboCategory[]