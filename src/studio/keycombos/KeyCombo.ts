import { KeyboardEvent as ReactKeyboardEvent } from "react";
import { LO } from "../util/ListenableObject";
import { SavedKeyCombo } from './KeyCombos';

const forbiddenKeys = ["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "ContextMenu"]

export default class KeyCombo {

  public readonly code: LO<string | null>
  public readonly ctrl: LO<boolean>
  public readonly shift: LO<boolean>
  public readonly alt: LO<boolean>

  public readonly displayName: LO<string>

  public readonly clashedWith = new LO<readonly KeyCombo[]>([])

  private readonly defaultCode: string | null
  private readonly defaultCtrl: boolean
  private readonly defaultShift: boolean
  private readonly deafultAlt: boolean

  public localScope: "global" | "modeler" | "mapper" | "texturer" | "animator" = "global"

  constructor(
    public readonly name: string,
    public readonly moreInfo: string,
    code: string | null,
    ctrl = true,
    shift = false,
    alt = false,
  ) {
    this.code = new LO(code)
    this.ctrl = new LO(ctrl)
    this.shift = new LO(shift)
    this.alt = new LO(alt)

    this.defaultCode = code
    this.defaultCtrl = ctrl
    this.defaultShift = shift
    this.deafultAlt = alt

    this.displayName = new LO(this.computeDisplayValue())
  }

  withScope(scope: typeof this['localScope']) {
    this.localScope = scope
    return this
  }



  private computeDisplayValue() {
    const combos: string[] = []

    if (this.ctrl.value) {
      combos.push("Ctrl")
    }
    if (this.shift.value) {
      combos.push("Shift")
    }
    if (this.alt.value) {
      combos.push("Alt")
    }

    if (this.code.value !== null) {
      combos.push(this.computeKeyCodeValue(this.code.value))
    }

    return combos.length === 0 ? "<NOTHING>" : combos.join(" + ")
  }

  private computeKeyCodeValue(code: string) {
    let result = this.execRegexOnCode(code, /Digit(\d)/)
    result ||= this.execRegexOnCode(code, /Key(.)/)
    result ||= this.execRegexOnCode(code, /Numpad(\d)/, 'Numpad')
    result ||= this.execRegexOnCode(code, /Numpad(.+)/, 'Numpad')
    result ||= code
    return result
  }

  private execRegexOnCode(code: string, regex: RegExp, prefix = "") {
    const matcher = code.match(regex)
    if (matcher !== null) {
      return `${prefix} ${matcher[1]}`
    }
    return null
  }


  isValid() {
    return this.isKeyValid() && this.isMetaValid() && this.clashedWith.value.length === 0
  }

  private isKeyValid() {
    return this.code.value === null || !forbiddenKeys.includes(this.code.value)
  }

  private isMetaValid() {
    return this.ctrl || this.shift || this.alt
  }

  matches(event: KeyboardEvent | ReactKeyboardEvent) {
    if (!this.isValid()) {
      return false
    }
    if (this.code.value !== null && this.code.value !== event.code) {
      return false
    }
    if (this.ctrl.value !== event.ctrlKey) {
      return false
    }
    if (this.shift.value !== event.shiftKey) {
      return false
    }
    if (this.alt.value !== event.altKey) {
      return false
    }

    return true
  }

  sharesScope(other: KeyCombo) {
    return this.localScope === "global" || other.localScope === "global" || this.localScope === other.localScope
  }

  //Whether this keycombo "contains" the other keycombo
  equals(other: KeyCombo) {
    if (other === this) {
      return false
    }
    if (other.code.value !== this.code.value) {
      return false
    }
    if (other.ctrl.value !== this.ctrl.value) {
      return false
    }
    if (other.shift.value !== this.shift.value) {
      return false
    }
    if (other.alt.value !== this.alt.value) {
      return false
    }
    return true
  }

  hasChangedFromDefault() {
    return this.code.value !== this.defaultCode || this.ctrl.value !== this.defaultCtrl || this.shift.value !== this.defaultShift || this.alt.value !== this.deafultAlt
  }

  reset() {
    this.code.value = this.defaultCode
    this.ctrl.value = this.defaultCtrl
    this.shift.value = this.defaultShift
    this.alt.value = this.deafultAlt

    this.displayName.value = this.computeDisplayValue()
  }

  fromEvent(event: KeyboardEvent | ReactKeyboardEvent) {
    this.code.value = event.code
    if (!this.isKeyValid()) {
      this.code.value = null
    }
    this.ctrl.value = event.ctrlKey
    this.shift.value = event.shiftKey
    this.alt.value = event.altKey

    this.displayName.value = this.computeDisplayValue()
  }

  copyFrom(saved: SavedKeyCombo) {
    this.code.value = saved.code
    this.ctrl.value = saved.ctrl
    this.shift.value = saved.shift
    this.alt.value = saved.alt

    this.displayName.value = this.computeDisplayValue()
  }

  writeSaved(): SavedKeyCombo {
    return {
      code: this.code.value,
      ctrl: this.ctrl.value,
      shift: this.shift.value,
      alt: this.alt.value,
    }
  }
}