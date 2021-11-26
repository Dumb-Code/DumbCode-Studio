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
  property_name: keyof S['data']

  //In the future, try and make these type safe?
  //This might not be possible, but I would do it with the accessors
  value: any,
  old_value: any,
}

export type UndoRedoSection = {
  section_name: string
  data: any
}

export type Action<S extends UndoRedoSection> = AddSectionAction<S> | RemoveSectionAction<S> | ModifySectionAction<S>

export default class UndoRedoHandler<S extends UndoRedoSection> {
  private batchActions = false
  private batchedActions: Action<S>[] = []

  public ignoreActions = false

  private sections: UndoRedoSection[] = []

  private history: Action<S>[][] = []
  private index = -1

  startBatchActions() {
    this.batchActions = true
    this.batchedActions = []
  }

  endBatchActions() {
    this.batchActions = false
    if (this.batchedActions.length !== 0) {
      this._PUSH(...this.batchedActions)
    }
  }

  private findSection<K extends string>(section_name: K) {
    return (this.sections.find(s => s.section_name === section_name) as (S & { section_name: K }) | undefined) ?? null
  }

  pruneHistory() { this.history.length = 0 }

  createNewSection<K extends string>(section_name: K): S & { section_name: K } {
    const section = {
      section_name,
      data: {}
    } as S & { section_name: K }
    this.sections.push(section)
    return section
  }

  private findOrCreateSection<K extends string>(section_name: K) {
    const section = this.findSection(section_name)
    if (section === null) {
      return this.createNewSection(section_name)
    }
    return section
  }

  //Should only be called when setting initial states.
  modifySectionDirectly<S extends UndoRedoSection, P extends keyof S['data']>(section: S, property_name: P, value: S['data'][P]) {
    const current = section.data[property_name]
    if (current !== undefined) {
      console.error(`Directly modified property ${property_name} on section ${section.section_name} twice. Previous: '${current}', New: '${value}'`)
    }
    section.data[property_name] = value
  }

  pushSectionCreation(section: S) {
    const action: AddSectionAction<S> = {
      type: "add",
      section_name: section.section_name,
      section_data: { ...section.data }
    }
    this._PUSH(action)
  }

  _PUSH(...actions: Action<S>[]) {
    if (this.ignoreActions) {
      return
    }
    if (this.batchActions) {
      this.batchedActions.push(...actions)
      return
    }
    this.history.push(actions)
    //@Wyn TODO - modify `this.index` accordintly. Look at previous implimentation.
    //Also, create LO for `canUndo` and `canRedo`
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
