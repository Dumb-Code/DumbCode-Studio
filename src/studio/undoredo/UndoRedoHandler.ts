import { SVGProps } from 'react';
import { SvgArrows, SvgEdit, SVGEye, SVGLocked, SVGPlus, SVGTerminal, SVGTrash } from "../../components/Icons";
import { LO } from './../util/ListenableObject';

// Undos and redos work as following.
// Definitions:
//   - The object: a traversable (can do undo/redo) object. Has "Sections" on it.
//
//   - Sections: Different sections on the object. For example, a model will have 
//               sections ["model_info", "cube_ashdajhs", "cube_ababshda"] ect.
//               Each section has different properties. To create a section, you assign
//               it a "handler", which handles changes within
//
//   - Properties: Changable properties within a section. These are handeled by the sections "handler".
//                 All properties must be JSON desializable, ie works with JSON.stringify and JSON.parse
//                 All properties should also be constant, and unchanging (readonly)
//
//   - Actions: A change on a section. Each action has it's own type of data. The three main sections are listed below.
//
//
// There are three "types" of actions, each with their own data:
//
// ::: ADD
//    - section_name: The section name to add
//    - section_data: The data for this section
//  - undoing this action will cause a REMOVE, with this section name
//
// ::: REMOVE
//    - section_name: The section to remove
//    - section_snapshot: Automatically generated. When dispatched, we take a snapshot of the data. 
//  - Undoing this action will cause a ADD, with this sections name, and the snapshot of this sections data.
//
// ::: MODIFY
//    - section_name: The section to modify within
//    - property_name: The property within the section to modify
//    - value: The new value to set in the property
//    - old_value: Automatically generated. When dispatched, we take a "snapshot" of the old value. 
//  - Undoing this action will set $property_name to $old_value
//
//
// Note that when treversing backwards and forwards, we traverse an array[][]. 
// This means that multiple changes can occur at the same time. 
// (When deleting a cube, the parents children array would also change)
//
// The grouping together of changes should only happen when `UndoRedoHandler.batchChanges`
// is true
//

type AddSectionAction<S extends UndoRedoSection> = {
  type: "add"
  section_name: S['section_name']
  section_data: S['data']
}

type RemoveSectionAction<S extends UndoRedoSection> = {
  type: "remove"
  section_name: S['section_name']
  section_snapshot: S['data']
}

type ModifySectionAction<S extends UndoRedoSection> = {
  type: "modify"
  section_name: S['section_name']
  property_name: keyof S['data'] & string

  //In the future, try and make these type safe?
  //This might not be possible, but I would do it with the accessors
  value: any,
  old_value: any,
}

//TODO:
// UndoRedoHandler has a listener for when states change?

export type UndoRedoSection = {
  section_name: string
  data: any,
}

export type Action<S extends UndoRedoSection> = AddSectionAction<S> | RemoveSectionAction<S> | ModifySectionAction<S>

export type HistoryActionIcon = { Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }

//Used to chain actions from different undohandlers together.
//When deleting a cube, you first have to deselect, then delete. This is two different handlers
type ActionChainState =
  "chainFirst" | //The first action in a chain
  "chainLast" |  //The last action in a chain
  "none"         //There is no chain

//Only add to this, chaning the order of existing ones will break undo/redo handlers loaded from .dcproj
export enum HistoryActionTypes {
  Command, Transformation, Add,
  Remove, Edit,
  ToggleVisibility, LockUnlock
}

export const HistoryActionIcons: Record<HistoryActionTypes, HistoryActionIcon> = {
  [HistoryActionTypes.Command]: { Icon: SVGTerminal },
  [HistoryActionTypes.Transformation]: { Icon: SvgArrows },
  [HistoryActionTypes.Add]: { Icon: SVGPlus },
  [HistoryActionTypes.Remove]: { Icon: SVGTrash },
  [HistoryActionTypes.Edit]: { Icon: SvgEdit },
  [HistoryActionTypes.ToggleVisibility]: { Icon: SVGEye },
  [HistoryActionTypes.LockUnlock]: { Icon: SVGLocked },
}

export type ActionBatch<S extends UndoRedoSection> = {
  time: number,
  actionType: HistoryActionTypes
  reason: string
  chainState: ActionChainState
  actions: Action<S>[]
}

export type SerializedUndoRedoHandler = {
  history: readonly ActionBatch<any>[];
  silentActions: Action<any>[];
  index: number;
}
export default class UndoRedoHandler<S extends UndoRedoSection> {
  private batchActions = false
  private batchedActions: Action<S>[] = []

  public ignoreActions = false

  private sections: UndoRedoSection[] = []

  public readonly history = new LO<readonly ActionBatch<S>[]>([])
  private readonly silentActions: Action<S>[] = []
  public readonly index = new LO(-1)

  public readonly canUndo = new LO(false)
  public readonly canRedo = new LO(false)

  constructor(
    private readonly addSectionCallback: <K extends S['section_name'], Sec extends S & { section_name: K }> (section_name: K, data: Sec['data']) => void,
    private readonly removeSectionCallback: (section_name: string) => void,
    private readonly modifySectionCallback: (section_name: string, property_name: string, value: any) => void
  ) {
    this.history.addPostListener(() => this._updateCanUndoCanRedo())
    this.index.addPostListener(() => this._updateCanUndoCanRedo())
  }

  isBatching() {
    return this.batchActions
  }

  startBatchActions() {
    this.batchActions = true
    this.batchedActions = []
  }

  endBatchActions(reason: string, actionType = HistoryActionTypes.Edit, chainState?: ActionChainState) {
    this.batchActions = false
    if (this.batchedActions.length !== 0) {
      this._PUSH(actionType, reason, this.batchedActions, chainState)
    }
  }

  jsonRepresentation(): SerializedUndoRedoHandler {
    if (this.batchActions) {
      this.endBatchActions("!Object Closed While Batching!")
    }

    const index = this.index.value
    const amountToClip = 100

    const startInArray = index - amountToClip

    //New array is 100 actions before the current index, plus all the current "undone" actions
    const newArray = this.history.value.slice(Math.max(0, startInArray), this.history.value.length)

    return {
      history: newArray,
      silentActions: this.silentActions,
      index: amountToClip + Math.min(startInArray, 0) //This is the new index in `newArray`. this.history[index] === newArray[newIndex]
    }
  }

  loadFromJson(object: SerializedUndoRedoHandler) {
    this.history.value = object.history
    this.index.value = object.index
    this.silentActions.length = 0
    this.silentActions.push(...object.silentActions)
  }

  private findSection<K extends string>(section_name: K) {
    return (this.sections.find(s => s.section_name === section_name) as (S & { section_name: K }) | undefined) ?? null
  }

  pruneHistory() { this.history.value = [] }

  createNewSection<K extends S['section_name']>(section_name: K, defaultReason?: string, defaultAction?: HistoryActionTypes): SectionHandle<S, S & { section_name: K }> {
    const section = {
      section_name,
      data: {}
    } as S & { section_name: K }
    this.sections.push(section)
    return new SectionHandle(this, section, defaultReason, defaultAction)
  }

  //Should only be called when setting initial states.
  modifySectionDirectly<S extends UndoRedoSection, P extends keyof S['data'] & string>(section: S, property_name: P, value: S['data'][P], allowPreviousValue = false) {
    const current = section.data[property_name]
    if (!allowPreviousValue && current !== undefined) {
      console.error(`Directly modified property ${property_name} on section ${section.section_name} twice. Previous: '${current}', New: '${value}'`)
    }
    section.data[property_name] = value
  }

  pushSectionCreation(section: S, reason: string, actionType = HistoryActionTypes.Add) {
    const action: AddSectionAction<S> = {
      type: "add",
      section_name: section.section_name,
      section_data: { ...section.data }
    }
    this._PUSH(actionType, reason, [action])
  }

  modifySection<P extends keyof S['data'] & string>(section: S, property_name: P, value: S['data'][P], old_value: S['data'][P], silent: boolean, reason: string, actionType: HistoryActionTypes) {
    section[property_name] = value
    const action: ModifySectionAction<S> = {
      type: "modify",
      section_name: section.section_name,
      property_name, value, old_value
    }
    if (silent) {
      this.silentActions.push(action)
    } else {
      this._PUSH(actionType, reason, [action])
    }
  }

  removeSection(section: S, reason: string, actionType = HistoryActionTypes.Remove) {
    const action: RemoveSectionAction<S> = {
      type: "remove",
      section_name: section.section_name,
      section_snapshot: { ...section.data },
    }
    this._PUSH(actionType, reason, [action])
  }

  private _PUSH(actionType: HistoryActionTypes, reason: string, actions: Action<S>[], chainState: ActionChainState = "none") {
    if (this.ignoreActions) {
      return
    }
    if (this.silentActions.length !== 0) {
      actions = [...this.silentActions, ...actions]
      this.silentActions.length = 0
    }
    if (this.batchActions) {
      this.batchedActions.push(...actions)
      return
    }

    actions = this.flatten(actions)

    const newArr = this.history.value.slice(0, this.index.value + 1)
    newArr.push({ actionType, reason, actions, chainState, time: Date.now() + (chainState === "chainLast" ? 0.5 : 0) })
    this.history.value = newArr
    this.index.value++
  }

  flatten(actions: Action<S>[]) {
    const result: Action<S>[] = []

    let modifySectionName: string | null = null
    let modifyPropertyName: string | null = null
    const modifyActionsBuffer: ModifySectionAction<S>[] = []

    const flattenBuffer = () => {
      if (modifyActionsBuffer.length !== 0) {
        const first = modifyActionsBuffer[0]
        const last = modifyActionsBuffer[modifyActionsBuffer.length - 1]
        const action: ModifySectionAction<S> = {
          type: 'modify',
          section_name: first.section_name,
          property_name: first.property_name,
          old_value: first.old_value,
          value: last.value,
        }
        result.push(action)
      }

      modifySectionName = null
      modifyPropertyName = null
      modifyActionsBuffer.length = 0
    }
    actions.forEach(a => {
      if (a.type !== "modify") {
        flattenBuffer()
        result.push(a)
        return
      }
      const { section_name, property_name } = a
      if ((modifySectionName !== null && section_name !== modifySectionName) || (modifyPropertyName !== null && property_name !== modifyPropertyName)) {
        flattenBuffer()
      }

      modifySectionName = section_name
      modifyPropertyName = property_name
      modifyActionsBuffer.push(a)
    })
    flattenBuffer()
    return result
  }

  undo() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    if (this.canUndo.value) {
      const movingFromHead = this.index.value === this.history.value.length - 1
      const actions = this.history.value[this.index.value--]
      this._updateCanUndoCanRedo()
      //We need to undo the current silent actions if we're undoing. 
      if (movingFromHead) {
        const flattenedSilent = this.flatten(this.silentActions)
        for (let i = flattenedSilent.length - 1; i >= 0; i--) {
          this.undoAction(flattenedSilent[i])
        }
      }
      for (let i = actions.actions.length - 1; i >= 0; i--) {
        this.undoAction(actions.actions[i])
      }
      return actions
    }
    return null
  }

  static undo(...handlers: (UndoRedoHandler<any> | undefined)[]) {
    const mappedHandlers = handlers
      .filter((handler): handler is UndoRedoHandler<any> => handler !== undefined && handler.canUndo.value)
      .map(handler => {
        const batch = handler.history.value[handler.index.value]
        return {
          handler,
          time: batch.time
        }
      })
    if (mappedHandlers.length === 0) {
      return
    }
    const sorted = mappedHandlers.sort((a, b) => b.time - a.time) //Reverse
    const action = sorted[0].handler.undo()
    if (action?.chainState === "chainLast") {
      const nextAction = UndoRedoHandler.getHead(...handlers)
      if (nextAction?.chainState === "chainFirst") {
        sorted[1].handler.undo()
      }
    }
  }

  private undoAction(act: Action<S>) {
    switch (act.type) {
      case "add":
        this._dispatchRemove(act.section_name)
        break
      case "modify":
        this._dispatchModify(act.section_name, act.property_name, act.old_value)
        break
      case "remove":
        this._dispatchAdd(act.section_name, act.section_snapshot)
        break
    }
  }

  redo() {
    if (this.canRedo.value) {
      const actions = this.history.value[++this.index.value]
      const movingToHead = this.index.value === this.history.value.length - 1
      this._updateCanUndoCanRedo()
      for (let i = 0; i < actions.actions.length; i++) {
        this.redoAction(actions.actions[i])
      }
      if (movingToHead) {
        const flattenedSilent = this.flatten(this.silentActions)
        for (let i = 0; i < flattenedSilent.length; i++) {
          this.redoAction(flattenedSilent[i])
        }
      }
      return actions
    }
    return null
  }

  static redo(...handlers: (UndoRedoHandler<any> | undefined)[]) {
    const mappedHandlers = handlers
      .filter((handler): handler is UndoRedoHandler<any> => handler !== undefined && handler.canRedo.value)
      .map(handler => ({ handler, time: handler.history.value[handler.index.value + 1].time }))
    if (mappedHandlers.length === 0) {
      return
    }
    const sorted = mappedHandlers.sort((a, b) => a.time - b.time)
    const action = sorted[0].handler.redo()
    if (action?.chainState === "chainFirst") {
      const nextAction = UndoRedoHandler.getHeadOffset(1, ...handlers)
      if (nextAction?.chainState === "chainLast") {
        sorted[1].handler.redo()
      }
    }
  }

  redoAction(act: Action<S>) {
    switch (act.type) {
      case "add":
        this._dispatchAdd(act.section_name, act.section_data)
        break
      case "modify":
        this._dispatchModify(act.section_name, act.property_name, act.value)
        break
      case "remove":
        this._dispatchRemove(act.section_name)
        break
    }
  }

  static getHead(...handlers: (UndoRedoHandler<any> | undefined)[]) {
    return this.getHeadOffset(0, ...handlers)
  }

  static getHeadOffset(offset: number, ...handlers: (UndoRedoHandler<any> | undefined)[]) {
    const heads = handlers
      .filter((handler): handler is UndoRedoHandler<any> => handler !== undefined)
      .map(handler => handler.getHead(offset))
      .filter(head => head !== undefined)
    if (heads.length === 0) {
      return null
    }
    return heads.reduce((prev, curr) => prev.time < curr.time ? curr : prev)
  }

  getHead(offset: number) {
    return this.history.value[this.index.value + offset]
  }

  private _dispatchAdd<K extends string, Sec extends S & { section_name: K }>(section: K, data: Sec['data']) {
    this.sections.push({
      section_name: section,
      data: { ...data }
    })
    const ignore = this.ignoreActions
    this.ignoreActions = true
    this.addSectionCallback(section, data)
    this.ignoreActions = ignore
  }

  private _dispatchRemove(section: string) {
    this.sections.filter(c => c.section_name === section)
    const ignore = this.ignoreActions
    this.ignoreActions = true
    this.removeSectionCallback(section)
    this.ignoreActions = ignore
  }

  private _dispatchModify(section_name: string, property_name: string, value: any) {
    const section = this.findSection(section_name)
    if (!section) {
      throw new Error("Unable to find section " + section_name);
    }
    section.data[property_name] = value
    if (value === undefined) {
      delete section.data[property_name]
    }
    const ignore = this.ignoreActions
    this.ignoreActions = true
    this.modifySectionCallback(section_name, property_name, value)
    this.ignoreActions = ignore
  }

  private _updateCanUndoCanRedo() {
    this.canUndo.value = this.index.value >= 0
    this.canRedo.value = this.index.value < this.history.value.length - 1
  }

}


export class SectionHandle<S extends UndoRedoSection, T extends S> {

  private callbackMap = new Map<string, (val: any) => void>()
  private prefixCallbackMap = new Map<string, (name: string, val: any) => void>()

  constructor(
    private readonly undoRedoHandler: UndoRedoHandler<S>,
    private readonly section: T,
    private readonly defaultReason = "Properties Edit",
    private readonly defaultAction: HistoryActionTypes = HistoryActionTypes.Edit
  ) {

  }

  modifyDirectly<P extends keyof T['data'] & string>(property_name: P, value: T['data'][P], allowPreviousValue = false) {
    this.undoRedoHandler.modifySectionDirectly(this.section, property_name, value, allowPreviousValue)
  }

  modifyFirst<P extends keyof T['data'] & string>(property_name: P, value: T['data'][P], onChange: (value: T['data'][P]) => void) {
    this.undoRedoHandler.modifySectionDirectly(this.section, property_name, value)
    this.callbackMap.set(property_name, onChange)
  }

  addPrefixCallback(prefix: string, callback: (name: string, val: any) => void) {
    this.prefixCallbackMap.set(prefix, callback)
  }

  modify<P extends keyof T['data'] & string>(property_name: P, value: T['data'][P], oldValue: T['data'][P], silent: boolean, reason = this.defaultReason, actionType = this.defaultAction) {
    this.undoRedoHandler.modifySection(this.section, property_name, value, oldValue, silent, reason, actionType)
  }

  pushCreation(reason: string, actionType = HistoryActionTypes.Add) {
    this.undoRedoHandler.pushSectionCreation(this.section, reason, actionType)
  }

  remove(reason: string, actionType = HistoryActionTypes.Remove) {
    this.undoRedoHandler.removeSection(this.section, reason, actionType)
  }

  applyModification(property_name: string, value: any) {
    const callback = this.callbackMap.get(property_name)
    if (callback) {
      callback(value)
      return
    }

    Array.from(this.prefixCallbackMap.entries())
      .filter(([prefix]) => property_name.startsWith(prefix))
      .forEach(([prefix, callback]) => callback(property_name.substring(prefix.length, property_name.length), value))
  }
}

//BELOW -- TESTING
// type TestType = {
//   section_name: "root_data",
//   data: {
//     name: string
//     age: number
//   }
// } | {
//   section_name: `cube_${string}`
//   data: {
//     idk: number
//   }
// }
// const a = new UndoRedoHandler<TestType>()
// const prop1 = a.createNewSection("root_data")
// prop1.data.prop1 = 2
// new LO(2).applyToSection(a, prop1, "prop1")

// const stringA = Math.random().toString()
// const prop2 = a.createNewSection(`cube_${stringA}`)
// prop2.data.prop2 = 2
// new LO(2).applyToSection(a, prop2, "prop2")
