import { KeyboardEvent as ReactKeyboardEvent } from "react";
import { LO } from "../listenableobject/ListenableObject";
import { SavedKeyCombo } from './KeyCombos';

const forbiddenKeys = ["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "ContextMenu"]

export type NeededEventData = { ctrlKey: boolean, shiftKey: boolean, altKey: boolean }

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

  public scope: string | null = "global"
  public validScopes: string[] = ["global"]

  private canBeNothing: boolean = false
  private canIncludeCodes: boolean = true

  private dontInferProps = false

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

  dontInfer() {
    this.dontInferProps = true
    return this
  }

  shouldInferProperties() {
    return !this.dontInferProps
  }

  setOnSpecificUnknownEvent(eventName: string) {
    return this
      .dontInfer()
      .setCanBeNothing(true)
      .setCanIncludeCodes(false)
      .withScopes([eventName])
      .setScope(eventName)
  }

  setCanBeNothing(canBeNothing: boolean) {
    this.canBeNothing = canBeNothing
    this.displayName.value = this.computeDisplayValue()
    return this
  }

  setCanIncludeCodes(canIncludeCodes: boolean) {
    this.canIncludeCodes = canIncludeCodes
    return this
  }


  setScope(scope: string | null) {
    this.scope = scope
    return this
  }

  withScopes(scopes: string[]) {
    this.validScopes = scopes
    return this
  }

  private isNothing() {
    return !this.ctrl.value && !this.shift.value && !this.alt.value && this.code.value === null
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

  isNothingValid() {
    return this.canBeNothing || !this.isNothing()
  }


  isValid() {
    return this.isKeyValid() && this.isMetaValid() && this.isNothingValid() && this.clashedWith.value.length === 0
  }

  private isKeyValid() {
    if (!this.canIncludeCodes) {
      return this.code.value === null
    }
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

  matchesUnknownEvent(event: NeededEventData) {
    if (!this.isValid()) {
      return false
    }
    if (this.code.value !== null) {
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

  isContainedInUnknownEvent(event: NeededEventData) {
    if (!this.isValid()) {
      return false
    }
    if (this.code.value !== null) {
      return false
    }
    if (this.ctrl.value && !event.ctrlKey) {
      return false
    }
    if (this.shift.value && !event.shiftKey) {
      return false
    }
    if (this.alt.value && !event.altKey) {
      return false
    }

    return true
  }

  computePriority() {
    let priority = 0
    if (this.ctrl.value) {
      priority += 1
    }
    if (this.shift.value) {
      priority += 1
    }
    if (this.alt.value) {
      priority += 1
    }
    if (this.code.value !== null) {
      priority += 1
    }
    return priority
  }

  sharesScope(other: KeyCombo) {
    return (
      (other.scope !== null && this.validScopes.includes(other.scope)) ||
      (this.scope !== null && other.validScopes.includes(this.scope))
    )
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

  copyFrom(saved?: SavedKeyCombo) {
    if (saved === undefined) {
      return
    }
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