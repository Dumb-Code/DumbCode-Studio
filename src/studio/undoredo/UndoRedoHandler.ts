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

type ADDSectionAction = {
  type: "add"
  section_name: string
  section_data: any
}

type RemoveSectionAction = {
  type: "remove"
  section_name: string
  section_snapshot: any
}

type ModifySectionAction = {
  type: "modify"
  section_name: string
  value: any
  old_value: any
}

type Section = {
  section_name: string
  data: any
}

export type Action = ADDSectionAction | RemoveSectionAction | ModifySectionAction

export default class UndoRedoHandler<S extends Section> {
  private batchActions = false
  private batchedActions: Action[] = []

  private sections: Section[] = []

  private history: Action[] = []
  private index = -1

  startBatchActions() {
    this.batchActions = true
    this.batchedActions = []
  }

  endBatchActions() {
    this.batchActions = false
  }

  private findSection<K extends string>(section_name: K) {
    return this.sections.find(s => s.section_name === section_name) as (S & { section_name: K }) ?? null
  }

  createNewSection<K extends string>(section_name: K): S & { section_name: K } {
    const section = {
      section_name,
      data: {}
    } as S & { section_name: K }
    this.sections.push(section)
    return section
  }

  //Should only be called when setting initial states.
  modifySectionDirectly
    <
      K extends string,                     //The section name
      Sec extends S & { section_name: K },  //Internal type, the section type,
      P extends keyof Sec['data'],          //The keys of the specified section data
    >
    (section_name: K, property_name: P, value: Sec['data'][P]) {
    const section = this.findSection(section_name)
    const current = section.data[property_name]
    if (current !== undefined) {
      console.error(`Directly modified property ${property_name} on section ${section_name} twice. Previous: '${current}', New: '${value}'`)
    }
    section.data[property_name] = value
  }

}


//BELOW -- TESTING
const a = new UndoRedoHandler<{
  section_name: "root_data",
  data: {
    prop1: number
    prop2: string
  }
} | {
  section_name: `cube_${string}`
  data: {
    prop2: number
  }
}>()
const prop1 = a.createNewSection("root_data")
prop1.data.prop1 = 2
a.modifySectionDirectly("root_data", "prop1", 5)

const prop2 = a.createNewSection("cube_abc")
prop2.data.prop2 = 2